import {
    changeProfilePicture,
    sendMessage,
  } from "../commands/whatsappService.js";
  import type { Plugin } from "../utils/types.js";
  
  const plugin: Plugin = {
    pattern: "changepp",
    description: "to change personal/group profile picture",
    category: "whatsapp",
  
    run: async ({ jid, msgText, quotedMsg, msgType, caption, sock }) => {
      try {
        if (msgText && msgText.length > 3) {
          // Either URL from text parameter or image URL from your server logic
          await changeProfilePicture(sock, jid, msgText, quotedMsg);
        } else {
          await sendMessage(
            sock,
            jid,
            "Usage:\n• Quote an image and use .changeprofilepicture\n• Or use .changeprofilepicture https://example.com/image.jpg"
          );
        }
      } catch (e) {
        if (e instanceof Error) {
          console.log("Error in changeprofilepicture plugin:", e.message);
        }
      }
    },
  };
  
  export default plugin;