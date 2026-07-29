import { randomUUID } from "node:crypto";
import { createEnvelope, normaliseModelUsage } from "./envelope";
import {
  queuePlatformEnvelope,
  reservePlatformSequences,
} from "./session-service";
import type { PlatformRouteManifest } from "./types";

export function readTurnId(request: Request): string {
  return request.headers.get("x-platform-turn-id")?.trim().slice(0, 160) || randomUUID();
}

export function readOptionalSessionHandle(request: Request): string | null {
  return request.headers.get("x-platform-session")?.trim() || null;
}

export async function queueTurnWithModelCall(input: {
  handle: string | null;
  turnId: string;
  surface: string;
  persona: string;
  brainSlug?: string;
  userMessage: string;
  assistantReply: string;
  manifest: PlatformRouteManifest;
  requestedModel: string;
  returnedModel?: string;
  usage?: unknown;
  finishReason?: string;
  responseId?: string;
  providerRequestId?: string;
  latencyMs?: number;
  provider?: string;
  fallback?: boolean;
  callIndex?: number;
}): Promise<void> {
  if (!input.handle) return;
  const { session, sequences } = await reservePlatformSequences(input.handle, 2);
  const returnedModel = input.returnedModel || input.requestedModel;
  const usage = normaliseModelUsage(input.usage);

  await Promise.all([
    queuePlatformEnvelope(
      createEnvelope({
        session,
        sequence: sequences[0],
        eventId: `evt-platform-${session.publicSessionId}-turn-${input.turnId}`,
        eventType: "Turn",
        summary: `${input.surface} exchange with ${input.persona}`,
        model: returnedModel,
        manifest: input.manifest,
        userMessage: input.userMessage,
        replyDigest: input.assistantReply,
        outcome: input.fallback ? "fallback" : "Completed",
        detail: {
          turnId: input.turnId,
          surface: input.surface,
          persona: input.persona,
          brainSlug: input.brainSlug,
          fallback: Boolean(input.fallback),
        },
      }),
    ),
    queuePlatformEnvelope(
      createEnvelope({
        session,
        sequence: sequences[1],
        eventId: `evt-platform-${session.publicSessionId}-model-${input.turnId}-${input.callIndex ?? 0}`,
        eventType: "Model Call",
        summary: `${input.surface} model call`,
        model: returnedModel,
        manifest: input.manifest,
        usage,
        outcome: input.fallback ? "fallback" : "Completed",
        detail: {
          turnId: input.turnId,
          parentEventId: `evt-platform-${session.publicSessionId}-turn-${input.turnId}`,
          provider: input.provider ?? "anthropic",
          requestedModel: input.requestedModel,
          returnedModel,
          finishReason: input.finishReason,
          responseId: input.responseId,
          providerRequestId: input.providerRequestId,
          latencyMs: input.latencyMs,
          callIndex: input.callIndex ?? 0,
          fallback: Boolean(input.fallback),
        },
      }),
    ),
  ]);
}

export async function queueTurnWithoutModel(input: {
  handle: string | null;
  turnId: string;
  surface: string;
  persona: string;
  brainSlug?: string;
  userMessage: string;
  assistantReply: string;
  manifest: PlatformRouteManifest;
  outcome: string;
}): Promise<void> {
  if (!input.handle) return;
  const { session, sequences } = await reservePlatformSequences(input.handle, 1);
  await queuePlatformEnvelope(
    createEnvelope({
      session,
      sequence: sequences[0],
      eventId: `evt-platform-${session.publicSessionId}-turn-${input.turnId}`,
      eventType: "Turn",
      summary: `${input.surface} exchange with ${input.persona}`,
      model: "none",
      manifest: input.manifest,
      userMessage: input.userMessage,
      replyDigest: input.assistantReply,
      outcome: input.outcome,
      detail: {
        turnId: input.turnId,
        surface: input.surface,
        persona: input.persona,
        brainSlug: input.brainSlug,
        fallback: true,
      },
    }),
  );
}

export async function queueChildModelCall(input: {
  handle: string | null;
  turnId: string;
  surface: string;
  manifest: PlatformRouteManifest;
  requestedModel: string;
  returnedModel?: string;
  usage?: unknown;
  finishReason?: string;
  responseId?: string;
  providerRequestId?: string;
  latencyMs?: number;
  provider?: string;
  fallback?: boolean;
  callIndex: number;
}): Promise<void> {
  if (!input.handle) return;
  const { session, sequences } = await reservePlatformSequences(input.handle, 1);
  const returnedModel = input.returnedModel || input.requestedModel;
  await queuePlatformEnvelope(
    createEnvelope({
      session,
      sequence: sequences[0],
      eventId: `evt-platform-${session.publicSessionId}-model-${input.turnId}-${input.callIndex}`,
      eventType: "Model Call",
      summary: `${input.surface} model call ${input.callIndex + 1}`,
      model: returnedModel,
      manifest: input.manifest,
      usage: normaliseModelUsage(input.usage),
      outcome: input.fallback ? "fallback" : "Completed",
      detail: {
        turnId: input.turnId,
        parentEventId: `evt-platform-${session.publicSessionId}-turn-${input.turnId}`,
        provider: input.provider ?? "anthropic",
        requestedModel: input.requestedModel,
        returnedModel,
        finishReason: input.finishReason,
        responseId: input.responseId,
        providerRequestId: input.providerRequestId,
        latencyMs: input.latencyMs,
        callIndex: input.callIndex,
        fallback: Boolean(input.fallback),
      },
    }),
  );
}
