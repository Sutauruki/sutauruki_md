import dotenv from "dotenv";
dotenv.config();

import { type Plugin } from "../utils/types.js";
import { loadPlugins } from "../pluginsLoader.js";
import { sendMessage } from "../commands/whatsappService.js";

interface CategoryMap {
  [key: string]: Plugin[];
}

const plugin: Plugin = {
  pattern: "menu",
  description: "Show all available commands",
  category: "info",

  run: async ({ jid, msgText, quotedMsg, msgType, caption, sock }) => {
    try {
      // Load plugins fresh each time to get latest list
      const plugins = await loadPlugins();

      // Group plugins by category
      const categories: CategoryMap = {
        fun: [],
        info: [],
        whatsapp: [],
        other: [],
        ai: [],
        business: []
      };

      // Sort plugins into categories
      plugins.forEach((plugin) => {
        const category = plugin.category || "other";
        if (categories[category]) {
          categories[category].push(plugin);
        } else {
          categories.other.push(plugin);
        }
      });

      // Build the menu text
      let menuText = `╭───  *SUTAURUKI-MD-MENU 📃* ───╮\n`;
      menuText += `│  *Available Commands - ${plugins.length}*\n`;
      menuText += `╰────────────────────────────╯\n\n`;

      // Info category
      if (categories.info.length > 0) {
        menuText += `╭───  *💻 INFO COMMANDS* ───╮\n`;
        categories.info.forEach((plugin) => {
          menuText += `│ *.${plugin.pattern}* - ${
            plugin.description ||"No description"
          }\n`;
        });
        menuText += `╰──────────────────────────╯\n\n`;
      }

      // Fun category
      if (categories.fun.length > 0) {
        menuText += `╭───  *🎮 FUN COMMANDS* ───╮\n`;
        categories.fun.forEach((plugin) => {
          menuText += `│ *.${plugin.pattern}* - ${
            plugin.description || "No description"
          }\n`;
        });
        menuText += `╰─────────────────────────╯\n\n`;
      }

      // AI category
      if (categories.ai.length > 0) {
        menuText += `╭───  *🤖 AI COMMANDS* ───╮\n`;
        categories.ai.forEach((plugin) => {
          menuText += `│ *.${plugin.pattern}* - ${
            plugin.description || "No description"
          }\n`;
        });
        menuText += `╰─────────────────────────╯\n\n`;
      }

      // WhatsApp category
      if (categories.whatsapp.length > 0) {
        menuText += `╭───  *🔧 WHATSAPP COMMANDS* ───╮\n`;
        categories.whatsapp.forEach((plugin) => {
          menuText += `│ *.${plugin.pattern}* - ${
            plugin.description || "No description"
          }\n`;
        });
        menuText += `╰───────────────────────────╯\n\n`;
      }

      // Business category
      if (categories.business.length > 0) {
        menuText += `╭───  *💼 BUSINESS COMMANDS* ───╮\n`;
        categories.business.forEach((plugin) => {
          menuText += `│ *.${plugin.pattern}* - ${
            plugin.description || "No description"
          }\n`;
        });
        menuText += `╰───────────────────────────╯\n\n`;
      }

      // Other category (if any)
      if (categories.other.length > 0) {
        menuText += `╭───  *🔧 OTHER COMMANDS* ───╮\n`;
        categories.other.forEach((plugin) => {
          menuText += `│ *.${plugin.pattern}* - ${
            plugin.description || "No description"
          }\n`;
        });
        menuText += `╰───────────────────────────╯\n\n`;
      }

      menuText += `*Bot by Sutauruki* 🥷\n`;
      menuText += `*Type any command to get started!*`;

      // Send the menu
      await sendMessage(sock, jid, menuText);

      console.log("Menu sent to " + jid);
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error in menu plugin: ${e.message}`);
      }
    }
  },
};

export default plugin;