import { sendMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "live",
  description: "Show live time of your timezone",
  category: "info",

  run: async ({ jid, msgText, quotedMsg, msgType, caption }) => {
    try {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, "0");
      const seconds = now.getSeconds().toString().padStart(2, "0");

      const ampm = hours >= 12 ? "pm" : "am";
      const hr12 = hours % 12 || 12;
      const time = `${hr12}:${minutes}:${seconds} ${ampm}`;
      const date = now.toDateString();
      const ramUsage = (process.memoryUsage().rss / 1024 / 1024 /10).toFixed(1);

      let wish = "ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";
      if (ampm === "am") {
        if (hours >= 0 && hours < 5) wish = "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ, ᴇᴀʀʟʏ ʙɪʀᴅ! 🌄";
        else if (hours >= 5 && hours < 12) wish = "ɢᴏᴏᴅ ᴍᴏʀɴɪɴɢ ⛅";
      } else {
        if (hours >= 12 && hours < 17) wish = "ɢᴏᴏᴅ ᴀғᴛᴇʀɴᴏᴏɴ 🌞";
        else if (hours >= 17 && hours < 20) wish = "ɢᴏᴏᴅ ᴇᴠᴇɴɪɴɢ 🌥";
        else wish = "ɢᴏᴏᴅ ɴɪɢʜᴛ 🌙";
      }

      const timenow = `
╭────────────────╮
│   *${wish}* 
│   *ᴛɪᴍᴇ* ⌚ ${time} 
│   *Date* 🎲 ${date}
│   *RamUsage* 🎲 ${ramUsage} 
╰────────────────╯
`;

      await sendMessage(jid, timenow);
      console.log("live Info sent to " + jid);
    } catch (error) {
      console.error("Error in live plugin:", error);
    }
  },
};

export default plugin;