import type {
  TruthRetrieveBody,
  DocPromoteBody,
  InteractionLogBody,
  KeyApproveBody,
  KeyRequestBody,
} from "@/lib/brains/types";

async function postJson<T>(url: string, body: unknown, headers?: HeadersInit): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });

  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error ?? `Request failed (${response.status})`);
  }
  return data;
}

export function requestBrainKey(body: KeyRequestBody) {
  return postJson<{
    requestId: string;
    status: string;
    requiresHumanApproval: boolean;
    expiresAt: string;
  }>("/api/brains/key/request", body);
}

export function approveBrainKey(body: KeyApproveBody) {
  return postJson<{
    grantId: string;
    status: string;
    expiresAt: string;
    maxUses: number;
  }>("/aie-demo/approve", body);
}

export function retrieveContext(body: TruthRetrieveBody) {
  return postJson<{
    snippets: { recordId: string; title: string; text: string; contentHash: string }[];
    manifest: { recordIds: string[]; hashes: string[]; grantId: string; retrievedAt: string };
    remainingUses: number;
  }>("/api/brains/truth/retrieve", body);
}

export function logInteraction(body: InteractionLogBody) {
  return postJson<{ logged: boolean; interactionId?: string }>(
    "/api/brains/interactions/log",
    body,
  );
}

export function promoteToTrusted(body: DocPromoteBody) {
  return postJson<{
    status: string;
    mode: string;
    promotedRecordIds: string[];
    approvalDecisionId: string;
  }>("/aie-demo/promote", body);
}

export function fetchDraftTruths(brainSlug: string) {
  return fetch(`/api/chapter1/draft-truths?brainSlug=${encodeURIComponent(brainSlug)}`).then(
    async (response) => {
      const data = (await response.json()) as {
        mode?: string;
        drafts?: Array<{
          recordId: string;
          title: string;
          canonicalText: string;
          proposedCategory: string;
          brainTheme?: string;
          status: string;
          proposedByAgent?: string;
          scope: string;
          source?: "workshop" | "fallback";
        }>;
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? "Could not load draft truths.");
      }
      return data;
    },
  );
}

export function saveUserBrainToWorkshop(body: {
  sessionId: string;
  name?: string;
  role?: string;
  goal?: string;
  profileLabel?: string;
  aiConfidence?: "new" | "comfortable" | "expert";
  contextConfidence?: "new" | "comfortable" | "expert";
  classificationSummary?: string;
  guideMode?: string;
}) {
  return postJson<{
    mode: string;
    saved: boolean;
    recordId?: string;
    message?: string;
  }>("/api/chapter1/user-brain/save", body);
}
