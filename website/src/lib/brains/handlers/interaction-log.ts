import {
  getWorkshopBaseId,
  getWorkshopWriteToken,
  useMemoryStore,
} from "../config";
import {
  BRAIN_INTERACTION_CONTEXT_FLAGGED,
  BRAIN_INTERACTION_REVIEW_STATUS,
  BRAIN_WORKSHOP_TABLES,
} from "../airtable-ids";
import { validatePersona } from "../guards";
import { sanitizeInteractionForPersistence } from "../secrets";
import { addMemoryInteraction, clearMemoryInteractionsForTests } from "./interaction-memory";
import type { InteractionLogBody } from "../types";

const memoryLogs: InteractionLogBody[] = [];

/**
 * Persists an interaction to Workshop (or the in-memory store).
 *
 * Household Activity / platform outbox writes are owned by
 * `queueTurnWithModelCall` and friends. Callers that successfully queue a
 * platform Turn should skip this helper so review history is not dual-written.
 * This helper must never pretend a write succeeded without persisting —
 * that silently drops conversations from the review queue.
 */
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

  if (useMemoryStore()) {
    const stored = addMemoryInteraction(entry);
    memoryLogs.push(entry);
    return {
      logged: true,
      storedManifestOnly: Boolean(entry.manifest?.grantId),
      interactionId: stored.interactionId,
      recordId: stored.recordId,
    };
  }

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_INTERACTIONS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.brainInteractions;

  if (workshopBaseId && workshopToken && tableId) {
    const recordId = await writeToWorkshop(workshopBaseId, tableId, workshopToken, entry);
    return {
      logged: true,
      storedManifestOnly: Boolean(entry.manifest?.grantId),
      interactionId: `int_${Date.now()}`,
      recordId,
    };
  }

  memoryLogs.push(entry);
  const stored = addMemoryInteraction(entry);
  return {
    logged: true,
    storedManifestOnly: Boolean(entry.manifest?.grantId),
    interactionId: stored.interactionId,
    recordId: stored.recordId,
  };
}

async function writeToWorkshop(
  baseId: string,
  tableId: string,
  token: string,
  entry: InteractionLogBody,
): Promise<string> {
  const interactionId = `int_${Date.now()}`;
  const url = `https://api.airtable.com/v0/${baseId}/${tableId}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      fields: {
        "Interaction ID": interactionId,
        "Session ID": entry.sessionId,
        Persona: entry.persona,
        "Brain Slug": entry.brainSlug,
        "User Message": entry.userMessage,
        "Assistant Reply": entry.assistantReply,
        Channel: entry.channel ?? "website",
        "Manifest Record IDs": (entry.manifest?.recordIds ?? []).join(", "),
        "Manifest Hashes": (entry.manifest?.hashes ?? []).join(", "),
        "Grant ID": entry.manifest?.grantId ?? "",
        "Review Status": BRAIN_INTERACTION_REVIEW_STATUS.new,
        "Context Flagged": BRAIN_INTERACTION_CONTEXT_FLAGGED.none,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Workshop interaction log failed (${response.status})`);
  }

  const data = (await response.json()) as { id?: string; records?: Array<{ id: string }> };
  const recordId = data.id ?? data.records?.[0]?.id;
  if (!recordId) throw new Error("Workshop interaction log returned no record id.");
  return recordId;
}

export function clearMemoryInteractionLogsForTests(): void {
  memoryLogs.length = 0;
  clearMemoryInteractionsForTests();
}
