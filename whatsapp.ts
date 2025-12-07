import { Boom } from "@hapi/boom";
import NodeCache from "@cacheable/node-cache";
import readline from "readline";
import makeWASocket, {
    delay,
    DisconnectReason,
    downloadAndProcessHistorySyncNotification,
    encodeWAM,
    fetchLatestBaileysVersion,
    getAggregateVotesInPollMessage,
    getHistoryMsg,
    isJidNewsletter,
    jidDecode,
    makeCacheableSignalKeyStore,
    normalizeMessageContent,
    proto,
    useMultiFileAuthState,
    getContentType,
    downloadMediaMessage,
    type AnyMessageContent,
    type BinaryInfo,
    type CacheStore,
    type WAMessageContent,
    type WAMessageKey,
    type WASocket,
  } from "@whiskeysockets/baileys";
// import { sock, logger, saveCreds } from "./config/socket.js";
import open from "open";
import fs from "fs/promises";
import { createWriteStream } from "fs";
import P from "pino";
import qrcode from "qrcode-terminal";

import dotenv from "dotenv";
import { loadPlugins } from "./pluginsLoader.js";
import {
  setSock,
  sendMessage,
  getGroupMetadata,
} from "./commands/whatsappService.js";
import { setBusinessSock } from "./commands/waBusiness.js";
import type { Plugin } from "./utils/types.js";
import { EventEmitter } from "events";
// import { uploadImagetoCloudinary } from "./commands/cloudinary.js";
import {
  loadAntiLinkGroups,
  addWarning,
  resetWarnings,
  warnings
} from "./utils/botDb.js";
import { formatMention } from "./utils/format.js";

export const botEvents = new EventEmitter();
export let isConnected = false;

dotenv.config();

let plugins: Plugin[] = [];

const doReplies = process.argv.includes("--do-reply");
const usePairingCode = process.argv.includes("--use-pairing-code");

// External map to store retry counts of messages when decryption/encryption fails
// Keep this out of the socket itself, so as to prevent a message decryption/encryption loop across socket restarts
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

// On-demand mapping storage
const onDemandMap = new Map<string, string>();

async function getMessage(
  key: WAMessageKey
): Promise<WAMessageContent | undefined> {
  return proto.Message.create({ conversation: "test" });
}

// Read line interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Helper function to prompt user input
const question = (text: string): Promise<string> =>
  new Promise((resolve) => rl.question(text, resolve));


export const startSock = async (): Promise<WASocket> => {

  // Use a default session name or ensure PN is defined
  const PN = process.env.PHONE_NUMBER || 'default';
  const SESSION_PATH = `baileys_auth_info/${PN}_session`;

  const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
  // ADD THIS DEBUG
  console.log("🔐 Session state loaded:");
  console.log("  - Has creds:", !!state.creds);
  console.log("  - Registered:", state.creds.registered);
  console.log("  - Keys count:", Object.keys(state.keys).length);
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
    printQRInTerminal: false,
});

  setSock(sock);
  setBusinessSock(sock)

  // Load plugins
  if (!plugins.length) {
    console.log("Loading plugins...");
    plugins = await loadPlugins();
    console.log(`${plugins.length} plugins ready`);
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr, isNewLogin } = update;

    if (qr) {
      console.log("QR Code received, scan it with your phone:");
      qrcode.generate(qr, { small: true });
      botEvents.emit("qr", qr);
    }

    if (isNewLogin) {
      console.log("> connection update { isNewLogin: true, qr: undefined }");
    }

    if (connection === "close") {
      isConnected = false;
      botEvents.emit("connection", false);
      const shouldReconnect =
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut;
      
      console.log(
        "connection closed due to",
        lastDisconnect?.error,
        ", reconnecting",
        shouldReconnect
      );

      if (shouldReconnect) {
        console.log("Reconnecting in 30 seconds...");
        await delay(30000);
        return startSock(); // Reconnect
      } else {
        console.log("Connection closed. You are logged out.");
        const PN = process.env.PHONE_NUMBER || 'default';
        const SESSION_PATH = `baileys_auth_info/${PN}_session`;
        await fs.rm(SESSION_PATH, { recursive: true, force: true });
        console.log("Session deleted, restart to login again");
        process.exit(0);
      }
    } else if (connection === "open") {
      isConnected = true;
      botEvents.emit("connection", true);
      // to send intro after connecting
      // await runSpecificPlugin("intro")
      console.log("WhatsApp connected!");
      console.log("Server is running on port 3000");
    }

    console.log("connection update", update);
  });

  sock.ev.on("creds.update", async () => {
    await saveCreds();
    console.log("  - Registered after creds:", state.creds.registered);
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

  async function runSpecificPlugin(name: string): Promise<void> {
    if (!plugins.length) {
      plugins = await loadPlugins();
    }

    const plugin = plugins.find((p) => p.pattern === name);
    if (!plugin) {
      console.log(`Plugin "${name}" not found`);
      return;
    }
    const phoneNumber = process.env.PHONE_NUMBER;

    // Fixed parameters to match what plugins expect
    await plugin.run({
      jid: `${phoneNumber}@s.whatsapp.net`,
      msgText: "",
      msgTime: Date.now(),
      caption: "",
      sock: sock!
    });
  }

  if (usePairingCode && !sock.authState.creds.registered) {
    const phoneNumber = await question("Please enter your phone number:\n");
    const code = await sock.requestPairingCode(phoneNumber);
    console.log(`Pairing code: ${code}`);
  }

  sock.ev.process(async (events) => {
    // history received
    if (events["messaging-history.set"]) {
      const { chats, contacts, messages, isLatest, progress, syncType } =
        events["messaging-history.set"];
      if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
        console.log("received on-demand history sync, messages=", messages);
      }
      console.log(
        `recv ${chats.length} chats, ${contacts.length} contacts, ${messages.length} msgs (is latest: ${isLatest}, progress: ${progress}%), type: ${syncType}`
      );
    }

    // received a new message
    if (events["messages.upsert"]) {
      const upsert = events["messages.upsert"];
      console.log("recv messages ", JSON.stringify(upsert, undefined, 2));

      if (upsert.requestId) {
        console.log(
          "placeholder message received for request of id=" + upsert.requestId,
          upsert
        );
      }

      //similar to whatsapp.onMessageReceived
      if (upsert.type === "notify") {
        for (const msg of upsert.messages) {
          const messageType = getContentType(msg.message!);
          const jid = msg.key.remoteJid!;
          const quotedMsg = msg
          const quotedMessage = {
            message: proto.Message,
            key: proto.MessageKey
          }
          const senderId = msg.key.participant || msg.key.remoteJid;
          console.log(jid, {
            text: `messagetype: ${messageType}\nmsg:\n\n${msg}`,
          });
          if (
            messageType === "conversation" ||
            messageType === "extendedTextMessage"
          ) {
            const text =
              msg.message?.conversation ||
              msg.message?.extendedTextMessage?.text;

            if (!text) continue;

            const cmd = text.slice(1).split(" ")[0];

            if (text.startsWith(".")) {
              for (const plugin of plugins) {
                if (plugin.pattern === cmd) {
                  try {
                    const newtext = text
                      .slice(plugin.pattern.length + 2)
                      .trim();

                    console.log(
                      `Executing plugin: ${plugin.pattern} for ${jid}`
                    );
                    await sock.readMessages([msg.key]);
                    // jid, msgText, quotedMsg, msgType, caption
                    await plugin.run({
                      jid,
                      msgText: newtext,
                      quotedMsg,
                      messageType,
                      msgType: messageType,
                      caption: newtext,
                      senderId: senderId!,
                      quotedMessage,
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
              console.log("replying to", msg.key.remoteJid);
              await sock.readMessages([msg.key]);

              if (text === "hi" || text === "hello") {
                await sendMessage(
                  msg.key.remoteJid!,
                  "Hello there!",
                  msg.message
                );
              } else if (text === "wassup") {
                const text = "I dey boss \n How's ya side?";
                await sendMessage(msg.key.remoteJid!, text, msg.message);
              }
            }

            if (!msg.key.fromMe && msg.key.remoteJid?.endsWith("@g.us")) {
              // Check if anti-link is enabled for this group
              const antiLinkGroups = await loadAntiLinkGroups();

              if (antiLinkGroups.has(msg.key.remoteJid)) {
                const text =
                  msg.message?.conversation ||
                  msg.message?.extendedTextMessage?.text;
                const linkRegex =
                  /(https?:\/\/[^\s]+)|(www\.[^\s]+)|([a-zA-Z0-9]+\.(com|net|org|io|co|me|tv|gg))/gi;

                if (text && linkRegex.test(text)) {
                  // Get group metadata
                  const groupMetadata = await getGroupMetadata(jid);
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
                          text: `⚠️ Warning ${count}/3 for ${formatMention(
                            senderId!
                          )}`,
                        },
                      );
                    } else {
                      await sock.sendMessage(jid, { delete: msg.key });

                      await sock.sendMessage(
                        jid,
                        {
                          text: `❌ Removing ${formatMention(
                            senderId!
                          )} after 3 warnings.`,
                        },
                      );

                      await sock.groupParticipantsUpdate(
                        msg.key.remoteJid!,
                        [msg.key.participant!],
                        "remove"
                      );

                      await sock.sendMessage(msg.key.remoteJid!, {
                        text: `@${
                          msg.key.participant!.split("@")[0]
                        } removed for sending links 3times`,
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
            const jid = msg.key.remoteJid!;
            const text =
              msg.message?.imageMessage?.caption ||
              msg.message?.extendedTextMessage?.contextInfo?.quotedMessage
                ?.imageMessage?.caption;

            if (!text) continue;

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
                        // pass this so that baileys can request a reupload of media
                        // that has been deleted
                        reuploadRequest: sock.updateMediaMessage,
                      }
                    );
                    // save to file
                    const writeStream = createWriteStream(
                      "media/images/my-download.jpeg"
                    );
                    stream.pipe(writeStream);
                    await delay(5000);
                    
                    console.log(
                      `Executing plugin: ${plugin.pattern} for ${jid}`
                    );
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
      }
    }

    // message updates
    if (events["messages.update"]) {
      console.log("recv messages update ", events["messages.update"]);
    }

    // message deletions
    if (events["messages.delete"]) {
      console.log("message deleted ", events["messages.delete"]);
    }

    // message reactions
    if (events["messages.reaction"]) {
      console.log("recv message reaction ", events["messages.reaction"]);
    }
  });

  return sock;
};

let sockInstance: WASocket | null = null;

export const getWhatsAppInstance = async (): Promise<WASocket> => {
  if (!sockInstance) {
    sockInstance = await startSock();
  }
  return sockInstance;
};