import { HOUSEHOLD_ACTIVITY_FIELDS } from "./ids";
import { contextReferenced } from "./manifest";
import type { PlatformActivityEnvelope } from "./types";

export function mapEnvelopeToActivityFields(
  envelope: PlatformActivityEnvelope,
): Record<string, unknown> {
  const fields = HOUSEHOLD_ACTIVITY_FIELDS;

  return {
    [fields.summary]: envelope.summary,
    [fields.eventId]: envelope.eventId,
    [fields.sequence]: envelope.sequence,
    [fields.sessionId]: envelope.publicSessionId,
    [fields.sessionLink]: [envelope.sessionRecordId],
    [fields.eventType]: envelope.eventType,
    [fields.timestamp]: envelope.timestamp,
    ...(envelope.userMessage ? { [fields.userMessage]: envelope.userMessage } : {}),
    ...(envelope.replyDigest ? { [fields.replyDigest]: envelope.replyDigest } : {}),
    [fields.contextReferenced]: contextReferenced(envelope.manifest),
    [fields.detail]: JSON.stringify(envelope.detail ?? {}),
    [fields.outcome]: envelope.outcome ?? "Completed",
    ...(envelope.targetUrl ? { [fields.targetUrl]: envelope.targetUrl } : {}),
    [fields.model]: envelope.model,
    [fields.reviewStatus]: "Unreviewed",
    ...(envelope.usage?.inputTokens !== undefined
      ? { [fields.tokensIn]: envelope.usage.inputTokens }
      : {}),
    ...(envelope.usage?.outputTokens !== undefined
      ? { [fields.tokensOut]: envelope.usage.outputTokens }
      : {}),
    ...(envelope.costUsd !== undefined ? { [fields.costUsd]: envelope.costUsd } : {}),
  };
}
