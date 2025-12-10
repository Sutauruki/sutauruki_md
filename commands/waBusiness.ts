
import { delay, type WASocket, type WAMessage, proto, generateWAMessageFromContent,  } from '@whiskeysockets/baileys'
import { sendMessage, sendImage } from './whatsappService.js'
import type { AnyMessageContent, WAMediaUpload } from '@whiskeysockets/baileys'
import { 
  productFunctions,
  userFunctions
} from "../utils/db.js";
import dotenv from "dotenv"
dotenv.config()

export const getcatalog = async (sock: WASocket, jid: string, limit: number = 10): Promise<void> => {
  // Fetch catalog
  const data = await sock.getCatalog({ jid, limit, cursor: '' });
  const products = data.products;

  if (!products || products.length === 0) {
    await sendMessage(sock, jid, 'No products found');
    return;
  }

  // Optional: also send a plain text summary of catalog
  let text = 'Catalog:\n\n';
  for (const p of products) {
    text += `*${p.name}*\n`;
    text += `💰 Price: ${p.currency} ${p.price}\n`;
    text += `📝 ${p.description || 'No description'}\n`;
    text += `🆔 ID: ${p.id}\n`;
    text += `🆔 Retailer ID: ${p.retailerId}\n`;
    text += `Url: https://wa.me/p/${p.id}/${sock.user?.id?.split(':')[0]}\n`
    text += `.....................\n\n`
    
  }
await sendMessage(sock, jid, text);
};

export const createProduct = async (sock: WASocket, jid: string, name: string, price: number, description: string, images : WAMediaUpload[], currency: string): Promise<void> => {
  // //Get User Store ID
  const user = await userFunctions().getUser({ phoneNumber: sock.user?.id?.split(':')[0] || null })
  if (!user.success) {
    await sendMessage(sock, jid, `${user.message}`)
    return
  }
  const stores = user.user.stores
  if (!stores || stores.length === 0) {
    await sendMessage(sock, jid, 'No stores found')
    return
  }
  const storeId = stores[0]!.storeId

  const extractUrls = (input : any) => {
  if (Array.isArray(input)) {
    return input
      .filter(item => item && item.url)
      .map(item => item.url)
  }

  if (typeof input === 'string') {
    const urls = input.match(/https:\/\/[^\s'"]+/g) || []
    return urls
  }

  return []
}


  console.log('image', images)
  console.log('extracted', extractUrls(images))

  // Creating The products
  const product =await productFunctions().createProduct({
    storeId: storeId,
    name: name,
    description: description,
    mrp: price * 1.5,
    price: price,
    category: "Whatsapp",
    instock: true,
    images: extractUrls(images)

  })

  sock.productCreate({
    name,
    price: price * 100,
    retailerId: storeId,
    description,
    currency: "NGN",
    originCountryCode: 'IN',
    images
  })

  await sendMessage(sock, jid, `Product created successfully`);
  await delay(60000);
  await getcatalog(sock, jid);
};
