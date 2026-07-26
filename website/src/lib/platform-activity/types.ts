export type PlatformActivityEventType =
  | "Turn"
  | "Model Call"
  | "Voice"
  | "Action"
  | "Decision"
  | "Session End";

export type PlatformSessionOutcome = "closed_by_user" | "timed_out" | "reopened";

export type PlatformManifestKind = "brain" | "code" | "mixed" | "none";

export type PlatformRouteManifest = {
  kind: PlatformManifestKind;
  recordIds: string[];
  urls: string[];
  promptVersion: string;
  source: string;
};

export type PlatformSessionHandlePayload = {
  v: 1;
  publicSessionId: string;
  sessionRecordId: string;
  issuedAt: string;
};

export type PlatformSessionLease = PlatformSessionHandlePayload & {
  parentSessionId?: string;
  handle: string;
  lastActivityAt: string;
  state: "active" | "paused" | "closing" | "closed";
  pausedAt?: string;
  closedAt?: string;
  outcome?: PlatformSessionOutcome;
  nextSequence: number;
};

export type PlatformModelUsage = {
  inputTokens?: number;
  outputTokens?: number;
};

export type PlatformActivityEnvelope = {
  eventId: string;
  sequence: number;
  publicSessionId: string;
  sessionRecordId: string;
  eventType: PlatformActivityEventType;
  timestamp: string;
  summary: string;
  model: string;
  userMessage?: string;
  replyDigest?: string;
  manifest: PlatformRouteManifest;
  outcome?: string;
  detail?: Record<string, unknown>;
  targetUrl?: string;
  usage?: PlatformModelUsage;
  costUsd?: number;
  rateCardVersion?: string;
};

export type PlatformOutboxItem = {
  v: 1;
  target: {
    baseId: string;
    tableId: string;
  };
  queuedAt: string;
  attempt: number;
  nextAttemptAt?: string;
  envelope: PlatformActivityEnvelope;
};

export type PlatformTurnContext = {
  handle: string;
  publicSessionId: string;
  turnId: string;
};
