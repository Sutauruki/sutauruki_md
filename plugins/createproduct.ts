import { createProduct } from "../commands/waBusiness.js";
import { sendMessage } from "../commands/whatsappService.js";
import type { Plugin } from "../utils/types.js";


const plugin: Plugin = {
  pattern: "cp",
  description: "To Create Product",
  category: "business",

  run: async ({ jid, msgText, quotedMsg, messageType, caption, newtext, senderId, quotedMessage, msgTime  }) => {
    try {
        // Function for parsing
        function parseProduct(raw: string) {
        const lines = raw.split("\n")

        const get = (key: string) => {
        const line = lines.find(l => l.toLowerCase().startsWith(key))
        if (!line) return ""
        return line.split(":").slice(1).join(":").trim()
        }

        const name = get("name")
        const price = Number(get("price"))
        const description = get("description")
        const currency = get("currency")

        const imagesRaw = get("images")
        const imagesArray = imagesRaw
        .split(",")
        .map(x => x.trim())
        .filter(x => x.length > 0)

        const images = imagesArray.map(url => ({ url }))

        return { name, price, description, currency, images }
        }

        if(msgText?.toLocaleLowerCase() == "help" || msgText?.length! <= 10) {
          const text = `To create a product, send the following format:\n

          .cp name: Product Name\n
          price: Product Price\n
          description: Product Description\n
          currency: Product Currency\n
          images: Product Images (comma separated)\n\n

          Example:\n
          .cp name: T-Shirt\n
          price: 10\n
          description: A comfortable T-Shirt\n
          images: https://example.com/image1.jpg,https://example.com/image2.jpg\n`
          await sendMessage(jid, text)

          return
        }

        const data = parseProduct(msgText!)

        await createProduct(
        jid,
        data.name,
        data.price,
        data.description,
        data.images,
        data.currency
        )

        } catch (error) {
      console.error("Error in createproduct plugin:", error);
    }
    },
};

export default plugin;