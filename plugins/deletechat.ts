import { deleteMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "deletechat",
  description: "to delete the last chat",
  category: "whatsapp",

  run: async ({ jid }) => {
    try {
      await deleteMessage(jid);
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in deletemessage plugin: " + e.message);
      }
    }
  },
};

export default plugin;