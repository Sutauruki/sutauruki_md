import { changeGroupDescription } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "changeGdesc",
  description: "Change group description",
  category: "whatsapp",

  run: async ({ jid, msgText, quotedMsg, msgType, caption, sock }) => {
    try {
      if (msgText) {
        await changeGroupDescription(sock, jid, msgText);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in changegdesc plugin: " + e.message);
      }
    }
  },
};

export default plugin;