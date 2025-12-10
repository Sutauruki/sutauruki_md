// plugins/saveviewonce.ts
import { 
  type WAMessage, 
  type WASocket, 
  getContentType, 
  downloadMediaMessage,
  proto
} from '@whiskeysockets/baileys'
import { sendMessage } from "../commands/whatsappService.js";

interface PluginParams {
  jid: string
  msgText: string
  quotedMsg: proto.IMessage
  messageType: string
  senderId: string
  sock: WASocket,
  caption: string,
  quotedMessage?: {
    message: proto.IMessage
    key: proto.IMessageKey
  }
}

export default {
  pattern: "vv",
  description: "Save view once messages (reply to a view once)",
  category: "media",

  run: async ({ jid, msgText, quotedMsg, messageType, caption, quotedMessage, sock }: PluginParams) => {
    if (!quotedMessage || !quotedMessage.message) {
      return await sendMessage(sock, jid, 'Reply to a view once message to save it')
    }

    try {
      let actualMessage = quotedMessage.message
      const messageType = getContentType(actualMessage)
      
      // Handle ViewOnceMessageV2
      if (messageType === 'viewOnceMessageV2' && actualMessage.viewOnceMessageV2?.message) {
        actualMessage = actualMessage.viewOnceMessageV2.message
      }
      
      const innerType = getContentType(actualMessage)
      if (!innerType) {
        return await sendMessage(sock, jid, 'Could not determine message type')
      }
      
      // Type-safe viewOnce check
      const mediaMessage = actualMessage[innerType as keyof proto.IMessage]
      const isViewOnce = (mediaMessage as any)?.viewOnce === true || messageType === 'viewOnceMessageV2'
      
      if (!isViewOnce) {
        return await sendMessage(sock, jid, 'This is not a view once message')
      }

      // Download media
      const buffer = await downloadMediaMessage(
        { message: actualMessage, key: quotedMessage.key } as WAMessage,
        'buffer',
        {},
        { 
          logger: sock.logger,
          reuploadRequest: sock.updateMediaMessage
        }
      ) as Buffer

      // Send based on type
      const caption = (mediaMessage as any)?.caption || 'Saved ViewOnce'
      
      if (innerType === 'imageMessage') {
        await sock.sendMessage(jid, { image: buffer, caption })
      } else if (innerType === 'videoMessage') {
        await sock.sendMessage(jid, { video: buffer, caption })
      } else if (innerType === 'audioMessage') {
        await sock.sendMessage(jid, { audio: buffer, mimetype: 'audio/mp4' })
      }

      await sendMessage(sock, jid, 'ViewOnce saved successfully')
      
    } catch (error) {
      console.log('Error saving viewonce:', (error as Error).message)
      await sendMessage(sock, jid, `Failed to save: ${(error as Error).message}`)
    }
  }
}