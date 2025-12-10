import dotenv from "dotenv";
dotenv.config();

import { getcatalog } from "../commands/waBusiness.js";
import type { Plugin } from "../utils/types.js";

const plugin: Plugin = {
  pattern: "getcat",
  description: "get catalog",
  category: "business",

  run: async ({ jid, sock}) => {
    try {
        getcatalog(sock, jid, 10)
        } catch (e) {
      if (e instanceof Error) {
        console.error(`Error in getCatalog plugin: ${e.message}`);
      }
    }
  },
};

export default plugin;