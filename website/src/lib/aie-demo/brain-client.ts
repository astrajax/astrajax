import type {
  ContextRetrieveBody,
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

export function retrieveContext(body: ContextRetrieveBody) {
  return postJson<{
    snippets: { recordId: string; title: string; text: string; contentHash: string }[];
    manifest: { recordIds: string[]; hashes: string[]; grantId: string; retrievedAt: string };
    remainingUses: number;
  }>("/api/brains/context/retrieve", body);
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
