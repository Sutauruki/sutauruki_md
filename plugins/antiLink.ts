import fs from "fs/promises";
import { sendMessage, getGroupMetadata } from "../commands/whatsappService.js";
import { antiLinkGroups } from "../utils/botDb.js";
import type { Plugin } from "../utils/types.js";

async function saveAntiLinkGroups(groups: Set<string>): Promise<void> {
  await fs.writeFile("db/antilink_groups.json", JSON.stringify([...groups]));
}

const plugin: Plugin = {
  pattern: "antilink",
  description: "Enable/disable anti-link for this group",
  category: "whatsapp",

  run: async ({ jid, msgText, quotedMsg, msgType, caption, senderId }) => {
    if (!jid.endsWith("@g.us")) {
      return await sendMessage(jid, "This command only works in groups!");
    }

    // Check if sender is admin
    const groupMetadata = await getGroupMetadata(jid);
    const sender = senderId;
    
    if (!sender) {
      return await sendMessage(jid, "Unable to identify sender!");
    }

    const senderIsAdmin = groupMetadata.participants.find(
      (p: any) =>
        p.id === sender && (p.admin === "admin" || p.admin === "superadmin")
    );

    if (!senderIsAdmin) {
      return await sendMessage(jid, "Only admins can use this command!");
    }

    const action = msgText?.toLowerCase() || "";

    if (action === "on" || action === "enable") {
      antiLinkGroups.add(jid);
      await saveAntiLinkGroups(antiLinkGroups);
      await sendMessage(jid, "✅ Anti-link enabled for this group");
    } else if (action === "off" || action === "disable") {
      antiLinkGroups.delete(jid);
      await saveAntiLinkGroups(antiLinkGroups);
      await sendMessage(jid, "❌ Anti-link disabled for this group");
    } else {
      await sendMessage(
        jid,
        `Anti-link is currently: ${
          antiLinkGroups.has(jid) ? "ON" : "OFF"
        }\n\nUsage:\n.antilink on\n.antilink off`
      );
    }
  },
};

export default plugin;