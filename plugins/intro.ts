import dotenv from "dotenv";
dotenv.config();

import { sendImage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "intro",
  description: "Intro of the bot owner",
  category: "fun",

  run: async ({ jid, msgText, quotedMsg, msgType, caption }) => {
    try {
      const phoneNumber = process.env.PHONE_NUMBER;
      const image = process.env.OWNER_PICTURE;

      if (!phoneNumber || !image) {
        throw new Error("Missing environment variables");
      }

      const text = ` ╭═══  *SUTAURUKI-MD* ═══\n │ Codename: Sutaruki\n │ Phone: wa.me/${phoneNumber}\n │ Github: https://github.com/Sutauruki \n │ X: https://x.com/sutauruki \n ╰═══════════`;

      // Send to the specified recipient
      await sendImage(jid, image, quotedMsg, undefined, text);
      console.log("Intro sent to " + jid);
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error in intro plugin: ${e.message}`);
      }
    }
  },
};

export default plugin;