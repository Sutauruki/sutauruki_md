import { changeProfileName } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "changepn",
  description: "Change your personal Profile name",
  category: "whatsapp",

  run: async ({ jid, msgText, quotedMsg, msgType, caption, sock }) => {
    try {
      if (msgText) {
        await changeProfileName(sock, jid, msgText, quotedMsg);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in changepn plugin: " + e.message);
      }
    }
  },
};

export default plugin;