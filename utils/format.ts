export function formatMention(id: string | undefined): string {
  if (!id) return "unknown";

  // If it's already a normal number JID
  if (id.endsWith("@s.whatsapp.net")) {
    return id;
  }
  return id;
}
