import { changeGroupName } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "changegn",
  description: "Change your group name",
  category: "whatsapp",

  run: async ({ jid, msgText, quotedMsg, msgType, caption }) => {
    try {
      if (msgText) {
        await changeGroupName(jid, msgText, quotedMsg);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in changegn plugin: " + e.message);
      }
    }
  },
};

export default plugin;