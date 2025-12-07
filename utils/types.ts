import type { WASocket } from "@whiskeysockets/baileys";

export interface Plugin {
  pattern: string;
  run: (params: {
    jid: string;
    msgText?: string;
    quotedMsg?: any;
    messageType?: string; // Changed from msgType to match whatsapp.ts
    msgType?: string; // Legacy support
    caption: string,
    newtext?: string;
    senderId?: string;
    quotedMessage?: any; // Added to match whatsapp.ts
    msgTime: number;
    sock: WASocket;
  }) => Promise<void>;
  // Add other properties your plugins might have
  description?: string;
  desc?: string; // Some plugins use desc instead of description
  category?: string;
}