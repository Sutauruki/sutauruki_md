import { delay, type WASocket, type WAMessage, proto } from '@whiskeysockets/baileys'
import axios from 'axios'

// Message content = msg, like message to quote = message
export async function typing(sock: WASocket, jid: string): Promise<void> {
  await sock.presenceSubscribe(jid)
  await delay(500)

  await sock.sendPresenceUpdate('composing', jid)
  await delay(2000)

  await sock.sendPresenceUpdate('paused', jid)
}

// send text with typing
export const sendMessage = async (
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> => {
  typing(sock, jid)
  await sock.sendMessage(jid, { text: msgText }, { quoted: quotedMsg })
}

// send image
export const sendImage = async (
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> => {
  const imagePath = msgText

  typing(sock, jid)
  await sock.sendMessage(jid, {
    image: { url: imagePath },
    caption: caption || "",
  })
}

// send audio
export const sendAudio = async (
  sock: WASocket,
  jid: string,
  audioPath: string,
  ptt: boolean = false
): Promise<void> => {
  await sock.sendMessage(jid, {
    audio: { url: audioPath },
    ptt
  })
}

// Delete Chat
export async function deleteMessage(sock: WASocket, jid: string): Promise<void> {
  const lastMsgInChat = await getLastMessageInChat(sock, jid)

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
async function getLastMessageInChat(sock: WASocket, jid: string): Promise<WAMessage> {
  // Implementation depends on how you store messages
  // This is a placeholder
  throw new Error("getLastMessageInChat not implemented")
}

// Change Profile Status
export async function changeProfileStatus(
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  await sock.updateProfileStatus(`${msgText}`)
  await sendMessage(sock, jid, `Status: ${msgText}`, quotedMsg)
}

// change Profile Picture
export async function changeProfilePicture(
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  try {
    await sock.updateProfilePicture(jid, { url: msgText })
    await sendMessage(sock, jid, `changed profile pic`, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      await sendMessage(sock, jid, `Error: ${e.message}\nurl: ${msgText}`)
      throw new Error(e.message)
    }
    throw e
  }
}

// fetch profile picture
export async function fetchProfilePicture(
  sock: WASocket,
  jid: string,
  msgText?: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  try {
    const ppUrl = await sock.profilePictureUrl(jid, 'image')
    await sendImage(sock, jid, ppUrl!, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Change ProfileName
export async function changeProfileName(
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  try {
    await sock.updateProfileName(msgText)
    await sendMessage(sock, jid, msgText, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Change Groupname
export async function changeGroupName(
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  try {
    await sock.groupUpdateSubject(jid, msgText)
    await sendMessage(sock, jid, `Group Subject has been updated to ${msgText}`, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Change Group description
export async function changeGroupDescription(
  sock: WASocket,
  jid: string,
  msgText: string,
  quotedMsg?: any,
  msgType?: string,
  caption?: string
): Promise<void> {
  try {
    await sock.groupUpdateDescription(jid, msgText)
    await sendMessage(sock, jid, msgText, quotedMsg)
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(e.message)
    }
    throw e
  }
}

// Only Admin
export async function onlyAdminMessage(sock: WASocket, jid: string): Promise<void> {
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
export async function everyoneMessage(sock: WASocket, jid: string): Promise<void> {
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
export async function getGroupMetadata(sock: WASocket, jid: string): Promise<any> {
  const metadata = await sock.groupMetadata(jid)
  return metadata
}