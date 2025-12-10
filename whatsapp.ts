import { Boom } from "@hapi/boom";
import NodeCache from "@cacheable/node-cache";
import readline from "readline";
import makeWASocket, {
    delay,
    DisconnectReason,
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    proto,
    useMultiFileAuthState,
    getContentType,
    downloadMediaMessage,
    type WAMessageContent,
    type WAMessageKey,
    type WASocket,
    type CacheStore,
    type IWebMessageInfo,
    isJidNewsletter,
} from "@whiskeysockets/baileys";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import P from "pino";
import qrcode from "qrcode-terminal";
import dotenv from "dotenv";
import { loadPlugins } from "./pluginsLoader.js";
import {
  sendMessage,
  getGroupMetadata,
} from "./commands/whatsappService.js";
import type { Plugin } from "./utils/types.js";
import { EventEmitter } from "events";
import {
  loadAntiLinkGroups,
  addWarning,
  resetWarnings,
} from "./utils/botDb.js";
import { formatMention } from "./utils/format.js";

export const botEvents = new EventEmitter();
// Map to store active sessions
export const sessions = new Map<string, WASocket>();

dotenv.config();

let plugins: Plugin[] = [];

// External map to store retry counts of messages when decryption/encryption fails
const msgRetryCounterCache = new NodeCache() as CacheStore;

const logger = P({
  level: "trace",
  transport: {
    targets: [
      {
        target: "pino/file",
        options: { destination: "./wa-logs.txt" },
        level: "trace",
      },
    ],
  },
});
logger.level = "info";

//Group Cache
const groupCache = new NodeCache({ stdTTL: 5 * 60, useClones: false });

async function getMessage(
  key: WAMessageKey
): Promise<WAMessageContent | undefined> {
  return proto.Message.create({ conversation: "test" });
}

export const createSession = async (sessionId: string): Promise<WASocket> => {
  const SESSION_PATH = `baileys_auth_info/${sessionId}_session`;

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  console.log(`🔐 Session state loaded for ${sessionId}:`);
  console.log("  - Registered:", state.creds.registered);

  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  const sock: WASocket = makeWASocket({
    version,
    logger,
    auth: {
      creds: state.creds,
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    msgRetryCounterCache,
    generateHighQualityLinkPreview: true,
    getMessage,
    markOnlineOnConnect: false,
    syncFullHistory: false,
    printQRInTerminal: false, // We will handle QR via API
  });

  sessions.set(sessionId, sock);

  // Load plugins if not loaded
  if (!plugins.length) {
    console.log("Loading plugins...");
    plugins = await loadPlugins();
    console.log(`${plugins.length} plugins ready`);
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update;

    if (qr) {
      console.log(`QR Code received for ${sessionId}`);
      // Emit QR with sessionId so API can pick it up
      botEvents.emit("qr", { sessionId, qr });
    }

    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      
      console.log(
        `Connection closed for ${sessionId} due to`,
        lastDisconnect?.error,
        ", reconnecting",
        shouldReconnect
      );

      if (shouldReconnect) {
        console.log(`Reconnecting ${sessionId} in 30 seconds...`);
        await delay(30000);
        await createSession(sessionId); // Reconnect
      } else {
        console.log(`Session ${sessionId} logged out.`);
        await deleteSession(sessionId);
      }
    } else if (connection === "open") {
      console.log(`WhatsApp connected for ${sessionId}!`);
      botEvents.emit("connection", { sessionId, status: true });
    }
  });

  sock.ev.on("creds.update", async () => {
    await saveCreds();
  });

  sock.ev.on("groups.update", async ([event]) => {
    if (!event) return;
    const metadata = await sock.groupMetadata(event.id!);
    groupCache.set(event.id!, metadata);
  });

  sock.ev.on("group-participants.update", async (event) => {
    const metadata = await sock.groupMetadata(event.id);
    groupCache.set(event.id, metadata);
  });

  sock.ev.process(async (events) => {
    if (events["messages.upsert"]) {
      const upsert = events["messages.upsert"];

      if (upsert.type === "notify") {
        for (const msg of upsert.messages) {
           await handleMessage(sock, msg);
        }
      }
    }
  });

  return sock;
};

async function handleMessage(sock: WASocket, msg: IWebMessageInfo) {
    const messageType = getContentType(msg.message!);
    const jid = msg.key.remoteJid!;
    const quotedMsg = msg; 
    
    // Extract quoted message correctly
    const contextInfo = msg.message?.extendedTextMessage?.contextInfo || 
                        msg.message?.imageMessage?.contextInfo ||
                        msg.message?.videoMessage?.contextInfo;
                        
    const quotedMessage = contextInfo?.quotedMessage ? {
        message: contextInfo.quotedMessage,
        key: {
            remoteJid: contextInfo.remoteJid || jid,
            id: contextInfo.stanzaId,
            participant: contextInfo.participant
        }
    } : undefined;

    const senderId = msg.key.participant || msg.key.remoteJid;

    console.log(jid, {
        text: `messagetype: ${messageType}\nmsg:\n\n${JSON.stringify(msg)}`,
    });

    if (messageType === "conversation" || messageType === "extendedTextMessage") {
        const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
        if (!text) return;

        const cmd = text.slice(1).split(" ")[0];
        if (text.startsWith(".")) {
            for (const plugin of plugins) {
                if (plugin.pattern === cmd) {
                    try {
                        const newtext = text.slice(plugin.pattern.length + 2).trim();
                        console.log(`Executing plugin: ${plugin.pattern} for ${jid}`);
                        await sock.readMessages([msg.key]);
                        await plugin.run({
                            jid,
                            msgText: newtext,
                            quotedMsg,
                            messageType,
                            msgType: messageType,
                            caption: newtext,
                            senderId: senderId!,
                            quotedMessage: quotedMessage as any, // Type assertion to match plugin interface
                            sock,
                            msgTime: Number(msg.messageTimestamp) * 1000
                        });
                    } catch (e) {
                        console.error("Plugin error:", e);
                    }
                }
            }
        }
        
        if (!msg.key.fromMe && !isJidNewsletter(msg.key?.remoteJid!)) {
            // console.log("replying to", msg.key.remoteJid);
            // await sock.readMessages([msg.key]);

            if (text === "hi" || text === "hello") {
                await sendMessage(
                    sock,
                    msg.key.remoteJid!,
                    "Hello there!",
                    msg.message
                );
            } else if (text === "wassup") {
                const text = "I dey boss \n How's ya side?";
                await sendMessage(sock, msg.key.remoteJid!, text, msg.message);
            }
        }

        if (!msg.key.fromMe && msg.key.remoteJid?.endsWith("@g.us")) {
            // Check if anti-link is enabled for this group
            const antiLinkGroups = await loadAntiLinkGroups();

            if (antiLinkGroups.has(msg.key.remoteJid)) {
                const linkRegex = /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.(com|net|org|io|co|me|tv|gg))/gi;

                if (text && linkRegex.test(text)) {
                    // Get group metadata
                    const groupMetadata = await getGroupMetadata(sock, jid);
                    // Get bot ID
                    function cleanJid(jid: string): string {
                        return jid.replace(/:\d+/, "");
                    }
                    const botId = cleanJid(sock.user!.lid!);

                    // Find bot in participants
                    const botIsAdmin = groupMetadata.participants.find(
                        (p: any) =>
                            p.id === botId &&
                            (p.admin === "admin" || p.admin === "superadmin")
                    );

                    // Find sender in participants
                    const senderIsAdmin = groupMetadata.participants.find(
                        (p: any) =>
                            p.id === senderId &&
                            (p.admin === "admin" || p.admin === "superadmin")
                    );

                    if (msg.key.fromMe) {
                        return; // Skip bot's own messages
                    }

                    // Remove if sender is not admin and bot is admin
                    if (!senderIsAdmin && botIsAdmin) {
                        const count = await addWarning(senderId!, jid);

                        if (count < 3) {
                            await sock.sendMessage(jid, { delete: msg.key });
                            await sock.sendMessage(
                                jid,
                                {
                                    text: `⚠️ Warning ${count}/3 for ${formatMention(senderId!)}`,
                                },
                            );
                        } else {
                            await sock.sendMessage(jid, { delete: msg.key });

                            await sock.sendMessage(
                                jid,
                                {
                                    text: `❌ Removing ${formatMention(senderId!)} after 3 warnings.`,
                                },
                            );

                            await sock.groupParticipantsUpdate(
                                msg.key.remoteJid!,
                                [msg.key.participant!],
                                "remove"
                            );

                            await sock.sendMessage(msg.key.remoteJid!, {
                                text: `@${msg.key.participant!.split("@")[0]} removed for sending links 3times`,
                                mentions: [msg.key.participant!],
                            });

                            await resetWarnings(senderId!, jid);
                        }
                    } else if (!botIsAdmin) {
                        await sock.sendMessage(msg.key.remoteJid!, {
                            text: "⚠️ I need admin privileges to remove link senders!",
                        });
                    }
                }
            }
        }

    } else if (messageType === "imageMessage") {
        const text = msg.message?.imageMessage?.caption ||
                     msg.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage?.caption;

        if (!text) return;

        const cmd = text.slice(1).split(" ")[0];

        if (text.startsWith(".")) {
            for (const plugin of plugins) {
                if (plugin.pattern === cmd) {
                    try {
                        await sock.readMessages([msg.key]);

                        // download the message
                        const stream = await downloadMediaMessage(
                            msg,
                            "stream", // can be 'buffer' too
                            {},
                            {
                                logger,
                                reuploadRequest: sock.updateMediaMessage,
                            }
                        );
                        // save to file
                        const writeStream = createWriteStream(
                            "media/images/my-download.jpeg"
                        );
                        stream.pipe(writeStream);
                        await delay(5000);
                        
                        console.log(`Executing plugin: ${plugin.pattern} for ${jid}`);
                        await plugin.run({
                            jid,
                            msgText: "media/images/my-download.jpeg",
                            quotedMessage: msg,
                            messageType,
                            msgType: messageType,
                            msgTime: Number(msg.messageTimestamp) * 1000,
                            caption: "",
                            sock
                        });
                    } catch (e) {
                        console.error("Plugin error:", e);
                    }
                }
            }
        }
    }
}

export const getSession = (sessionId: string): WASocket | undefined => {
  return sessions.get(sessionId);
};

export const deleteSession = async (sessionId: string) => {
  sessions.delete(sessionId);
  const SESSION_PATH = `baileys_auth_info/${sessionId}_session`;
  try {
    await fs.rm(SESSION_PATH, { recursive: true, force: true });
    console.log(`Session ${sessionId} deleted.`);
  } catch (error) {
    console.error(`Error deleting session ${sessionId}:`, error);
  }
};

export const restoreSessions = async () => {
  console.log("Restoring sessions...");
  try {
    const files = await fs.readdir("baileys_auth_info");
    const sessionIds = files
      .filter((f) => f.endsWith("_session"))
      .map((f) => f.replace("_session", ""));

    for (const sessionId of sessionIds) {
      console.log(`Restoring session: ${sessionId}`);
      await createSession(sessionId);
    }
  } catch (error) {
    console.error("Error restoring sessions:", error);
  }
};