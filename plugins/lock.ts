import { onlyAdminMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "lock",
  description: "Change group setting to only admin",
  category: "whatsapp",

  run: async ({ jid }) => {
    try {
      await onlyAdminMessage(jid);
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in lock plugin: " + e.message);
      }
    }
  },
};

export default plugin;