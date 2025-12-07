import {
    changeProfileStatus,
    sendMessage,
  } from "../commands/whatsappService.js";
  import type { Plugin } from "../utils/types.js";
  
  const plugin: Plugin = {
    pattern: "changeps",
    description: "to change profile bio",
    category: "whatsapp",
  
    run: async ({ jid, msgText, quotedMsg, msgType, caption }) => {
      try {
        if (msgText && msgText.length > 3) {
          await changeProfileStatus(jid, msgText);
        } else {
          const text =
            "To use \n*.changeprofilestatus* followed by text > 3\n> eg .changeprofilestatus using sutauruki-md";
          await sendMessage(jid, text);
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log("Error in changeprofilestatus plugin: " + e.message);
        }
      }
    },
  };
  
  export default plugin;