import dotenv from "dotenv";
dotenv.config();

import { chatGPT } from "../commands/groq.js";
import { sendMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "chatgpt",
  description: "to chat with openai/gpt-oss-20b",
  category: "ai",

  run: async ({ jid, msgText, quotedMsg, msgType, caption, sock }) => {
    try {
      if (msgText && msgText.length > 3) {
        // Get AI response
        const aiResponse = await chatGPT(
          `You are responding for a WhatsApp chat. 
          Return your response as plain text only. 
          Do not use markdown, code blocks, or special formatting. 
          Keep it natural and formatted like a WhatsApp message. 
          Message: ${msgText}`
        );
        // Send AI response
        await sendMessage(sock, jid, aiResponse);
      } else {
        const text =
          "To use \n*.chatgpt* followed by text > 3\n> eg .chatgpt Explain Quantum Physics";
        await sendMessage(sock, jid, text);
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error(`Error in groqchat plugin: ${e.message}`);
      }
    }
  },
};

export default plugin;