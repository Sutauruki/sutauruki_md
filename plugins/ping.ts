import { sendMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "ping",
  description: "To Check reply time",
  category: "info",

  run: async ({ jid, msgText, quotedMsg, messageType, caption, newtext, senderId, quotedMessage, msgTime  }) => {
    try {
        const now = Date.now()
        const latency = now - msgTime
        const text = ` pong 🏓 \n ${latency} ms`

            sendMessage(jid, text)
        } catch (error) {
      console.error("Error in ping 🏓 plugin:", error);
    }
    },
};

export default plugin;