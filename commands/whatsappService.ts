import { delay, type WASocket, type WAMessage, proto } from '@whiskeysockets/baileys'
import axios from 'axios'

let sock: WASocket | null = null

export const setSock = (s: WASocket): void => {
  sock = s
}

// Message content = msg, like message to quote = message
export async function typing(jid: string): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")

  await sock.presenceSubscribe(jid)
  await delay(500)

  await sock.sendPresenceUpdate('composing', jid)
  await delay(2000)

  await sock.sendPresenceUpdate('paused', jid)
}

// send text with typing
export const sendMessage = async (
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> => {
  if (!sock) throw new Error("Socket not set yet")
  typing(jid)
  await sock.sendMessage(jid, { text: msgText }, { quoted: quotedMsg })
}

// send image
export const sendImage = async (
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> => {
  if (!sock) throw new Error("Socket not set yet")

  const imagePath = msgText

  typing(jid)
  await sock.sendMessage(jid, {
    image: { url: imagePath },
    caption: caption || "",
  })
}

// send audio
export const sendAudio = async (
  jid: string,
  audioPath: string,
  ptt: boolean = false
): Promise<void> => {
  if (!sock) throw new Error("Socket not set yet")

  await sock.sendMessage(jid, {
    audio: { url: audioPath },
    ptt
  })
}

// Delete Chat
export async function deleteMessage(jid: string): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  
  const lastMsgInChat = await getLastMessageInChat(jid)

  await sock.chatModify(
    {
      delete: true,
      lastMessages: [
        {
          key: lastMsgInChat.key,
          messageTimestamp: lastMsgInChat.messageTimestamp
        }
      ]
    },
    jid
  )
}

// Helper function for getLastMessageInChat (you'll need to implement this)
async function getLastMessageInChat(jid: string): Promise<WAMessage> {
  if (!sock) throw new Error("Socket not set yet")
  // Implementation depends on how you store messages
  // This is a placeholder
  throw new Error("getLastMessageInChat not implemented")
}

// Change Profile Status
export async function changeProfileStatus(
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  await sock.updateProfileStatus(`${msgText}`)
  await sendMessage(jid, `Status: ${msgText}`, quotedMsg)
}

// change Profile Picture
export async function changeProfilePicture(
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    await sock.updateProfilePicture(jid, { url: msgText })
    await sendMessage(jid, `changed profile pic`, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      await sendMessage(jid, `Error: ${e.message}\nurl: ${msgText}`)
      throw new Error(e.message)
    }
    throw e
  }
}

// fetch profile picture
export async function fetchProfilePicture(
  jid: string,
  msgText?: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    const ppUrl = await sock.profilePictureUrl(jid, 'image')
    await sendImage(jid, ppUrl!, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Change ProfileName
export async function changeProfileName(
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    await sock.updateProfileName(msgText)
    await sendMessage(jid, msgText, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Change Groupname
export async function changeGroupName(
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    await sock.groupUpdateSubject(jid, msgText)
    await sendMessage(jid, `Group Subject has been updated to ${msgText}`, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Change Group description
export async function changeGroupDescription(
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    await sock.groupUpdateDescription(jid, msgText)
    await sendMessage(jid, msgText, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Only Admin
export async function onlyAdminMessage(jid: string): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    await sock.groupSettingUpdate(jid, 'announcement')
    await sock.groupSettingUpdate(jid, 'locked')
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Everyone
export async function everyoneMessage(jid: string): Promise<void> {
  if (!sock) throw new Error("Socket not set yet")
  try {
    await sock.groupSettingUpdate(jid, 'not_announcement')
    await sock.groupSettingUpdate(jid, 'unlocked')
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// fetch group data
export async function getGroupMetadata(jid: string): Promise<any> {
  if (!sock) throw new Error("Socket not set yet")
  const metadata = await sock.groupMetadata(jid)
  return metadata
}