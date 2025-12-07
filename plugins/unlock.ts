import { everyoneMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "unlock",
  description: "Change group setting to everyone",
  category: "whatsapp",

  run: async ({ jid }) => {
    try {
      await everyoneMessage(jid);
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in unlock plugin: " + e.message);
      }
    }
  },
};

export default plugin;