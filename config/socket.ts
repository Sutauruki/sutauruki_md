import { 
    type WASocket,
    makeWASocket, 
    fetchLatestBaileysVersion,
    makeCacheableSignalKeyStore,
    useMultiFileAuthState,
    type WAMessageKey,
    type CacheStore,
    type WAMessageContent,
    proto
 } from '@whiskeysockets/baileys'
import P from "pino";
import NodeCache from "@cacheable/node-cache";
import dotenv from "dotenv";

dotenv.config();

const msgRetryCounterCache = new NodeCache() as CacheStore;

// Use a default session name or ensure PN is defined
const PN = process.env.PHONE_NUMBER || 'default';
const SESSION_PATH = `src/services/whatsapp/baileys_auth_info/${PN}_session`;

const { state, saveCreds } = await useMultiFileAuthState(SESSION_PATH);
const { version, isLatest } = await fetchLatestBaileysVersion();
console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

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

async function getMessage(
  key: WAMessageKey
): Promise<WAMessageContent | undefined> {
  return proto.Message.create({ conversation: "test" });
}

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
});

// IMPORTANT: Only register creds.update here
sock.ev.on('creds.update', saveCreds);

export { sock, logger, saveCreds };