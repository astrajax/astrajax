import { randomUUID } from "node:crypto";
import { contextReferenced } from "./manifest";
import { calculateModelCost } from "./rate-card";
import { scrubObviousSecrets } from "./scrub";
import type {
  PlatformActivityEnvelope,
  PlatformModelUsage,
  PlatformOutboxItem,
  PlatformRouteManifest,
  PlatformSessionHandlePayload,
} from "./types";

function readTokenCount(value: unknown): number | undefined {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (value && typeof value === "object" && "total" in value) {
    const total = (value as { total?: unknown }).total;
    if (typeof total === "number" && Number.isFinite(total)) return total;
  }
  return undefined;
}

export function normaliseModelUsage(raw: unknown): PlatformModelUsage {
  if (!raw || typeof raw !== "object") return {};
  const usage = raw as Record<string, unknown>;
  return {
    inputTokens: readTokenCount(usage.inputTokens ?? usage.promptTokens ?? usage.input_tokens),
    outputTokens: readTokenCount(
      usage.outputTokens ?? usage.completionTokens ?? usage.output_tokens,
    ),
  };
}

export function createEventId(publicSessionId: string, kind: string, stableKey?: string): string {
  const safeKind = kind.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const suffix = stableKey?.trim() || randomUUID();
  return `evt-platform-${publicSessionId}-${safeKind}-${suffix}`.slice(0, 240);
}

export function createEnvelope(input: {
  session: PlatformSessionHandlePayload;
  sequence: number;
  eventType: PlatformActivityEnvelope["eventType"];
  summary: string;
  model: string;
  manifest: PlatformRouteManifest;
  eventId?: string;
  userMessage?: string;
  replyDigest?: string;
  outcome?: string;
  detail?: Record<string, unknown>;
  targetUrl?: string;
  usage?: PlatformModelUsage;
}): PlatformActivityEnvelope {
  const usage = input.usage ?? {};
  const cost = calculateModelCost(input.model, usage);
  return {
    eventId:
      input.eventId ??
      createEventId(input.session.publicSessionId, input.eventType, String(input.sequence)),
    sequence: input.sequence,
    publicSessionId: input.session.publicSessionId,
    sessionRecordId: input.session.sessionRecordId,
    eventType: input.eventType,
    timestamp: new Date().toISOString(),
    summary: input.summary.slice(0, 500),
    model: input.model || "none",
    userMessage: input.userMessage ? scrubObviousSecrets(input.userMessage) : undefined,
    replyDigest: input.replyDigest
      ? scrubObviousSecrets(input.replyDigest).slice(0, 500)
      : undefined,
    manifest: input.manifest,
    outcome: input.outcome,
    targetUrl: input.targetUrl,
    usage,
    costUsd: cost.costUsd,
    rateCardVersion: cost.rateCardVersion,
    detail: {
      ...input.detail,
      manifest: input.manifest,
      contextReferenced: contextReferenced(input.manifest),
      ...(cost.rateCardVersion ? { rateCardVersion: cost.rateCardVersion } : {}),
    },
  };
}

export function toOutboxItem(envelope: PlatformActivityEnvelope): PlatformOutboxItem {
  return {
    v: 1,
    target: {
      baseId: process.env.HOUSEHOLD_ACTIVITY_BASE_ID ?? "appF7jQD4ZKrDC7e1",
      tableId: process.env.HOUSEHOLD_ACTIVITY_TABLE_ID ?? "tblNxNLyC31KDQbRl",
    },
    queuedAt: new Date().toISOString(),
    attempt: 0,
    envelope,
  };
}
