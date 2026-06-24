import { getWorkshopBaseId, getWorkshopWriteToken } from "../config";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { validatePersona } from "../guards";
import { sanitizeInteractionForPersistence } from "../secrets";
import type { InteractionLogBody } from "../types";

const memoryLogs: InteractionLogBody[] = [];

export async function handleInteractionLog(body: InteractionLogBody) {
  validatePersona(body.persona);

  if (!body.sessionId?.trim()) throw new Error("sessionId is required.");
  if (!body.brainSlug?.trim()) throw new Error("brainSlug is required.");
  if (!body.userMessage?.trim()) throw new Error("userMessage is required.");
  if (!body.assistantReply?.trim()) throw new Error("assistantReply is required.");

  const persisted = sanitizeInteractionForPersistence({
    userMessage: body.userMessage.trim(),
    assistantReply: body.assistantReply.trim(),
    manifest: body.manifest,
  });

  const entry: InteractionLogBody = {
    sessionId: body.sessionId.trim(),
    persona: body.persona,
    brainSlug: body.brainSlug.trim(),
    userMessage: persisted.userMessage,
    assistantReply: persisted.assistantReply,
    manifest: persisted.manifest,
    channel: body.channel ?? "website",
  };

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.brainInteractions;

  if (workshopBaseId && workshopToken && tableId) {
    await writeToWorkshop(workshopBaseId, tableId, workshopToken, entry);
  } else {
    memoryLogs.push(entry);
  }

  return {
    logged: true,
    storedManifestOnly: Boolean(entry.manifest?.grantId),
    interactionId: `int_${Date.now()}`,
  };
}

async function writeToWorkshop(
  baseId: string,
  tableId: string,
  token: string,
  entry: InteractionLogBody,
): Promise<void> {
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "Session ID": entry.sessionId,
        Persona: entry.persona,
        "Brain Slug": entry.brainSlug,
        "User Message": entry.userMessage,
        "Assistant Reply": entry.assistantReply,
        Channel: entry.channel ?? "website",
        "Manifest Record IDs": (entry.manifest?.recordIds ?? []).join(", "),
        "Manifest Hashes": (entry.manifest?.hashes ?? []).join(", "),
        "Grant ID": entry.manifest?.grantId ?? "",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Workshop interaction log failed (${response.status})`);
  }
}

export function getMemoryInteractionLogsForTests(): InteractionLogBody[] {
  return [...memoryLogs];
}

export function clearMemoryInteractionLogsForTests(): void {
  memoryLogs.length = 0;
}
