import { fetchProfilePicture } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "fetchpp",
  description: "Fetch Personal/Group Profile Picture",
  category: "whatsapp",

  run: async ({ jid, msgText, quotedMsg, msgType, caption }) => {
    try {
      await fetchProfilePicture(jid, undefined, quotedMsg);
    } catch (e) {
      if (e instanceof Error) {
        console.log("Error in fetchpp plugin: " + e.message);
      }
    }
  },
};

export default plugin;