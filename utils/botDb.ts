import fs from "fs/promises";

export interface Warnings {
  [jid: string]: {
    [senderId: string]: number;
  };
}

export async function loadAntiLinkGroups(): Promise<Set<string>> {
  try {
    const data = await fs.readFile("db/antilink_groups.json", "utf8");
    return new Set(JSON.parse(data));
  } catch {
    return new Set();
  }
}

export let antiLinkGroups = await loadAntiLinkGroups();

async function loadWarnings(): Promise<Warnings> {
  try {
    const data = await fs.readFile("db/warnings.json", "utf8");
    return JSON.parse(data);
  } catch {
    return {};
  }
}

export let warnings = await loadWarnings();

async function saveWarnings(): Promise<void> {
  await fs.writeFile("db/warnings.json", JSON.stringify(warnings, null, 2));
}

// add a warning
export async function addWarning(senderId: string, jid: string): Promise<number> {
  if (!warnings[jid]) warnings[jid] = {};
  if (!warnings[jid][senderId]) warnings[jid][senderId] = 0;

  warnings[jid][senderId] += 1;
  await saveWarnings();
  return warnings[jid][senderId];
}

// reset warnings
export async function resetWarnings(senderId: string, jid: string): Promise<void> {
  if (warnings[jid] && warnings[jid][senderId]) {
    delete warnings[jid][senderId];
    await saveWarnings();
  }
}
