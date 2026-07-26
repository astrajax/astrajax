import { handleInteractionLog } from "@/lib/brains/handlers/interaction-log";
import { retrieveTrustedSnippets } from "@/lib/brains/trusted-truth";
import type { ContextBlock } from "@/lib/clive/types";
import {
  buildCurationGroundingManifest,
  extractManifestRecordIds,
  serialiseGroundingManifest,
} from "./grounding";
import { loadCurationDocket } from "./knowledge";
import {
  buildCurationMessages,
  buildCurationSystemPrompt,
  resolveCurationModel,
} from "./prompt";
import {
  CURATION_TOOLS,
  parseToolInput,
  toolDestination,
  type CurationToolName,
} from "./tools";
import type { CurationChatRequest, CurationChatResponse, CurationProposal } from "./types";
import type { PlatformRouteManifest } from "@/lib/platform-activity/types";
import {
  queueChildModelCall,
  queueTurnWithModelCall,
} from "@/lib/platform-activity/server";

const MAX_MESSAGE_LENGTH = 800;
const MAX_TOOL_ROUNDS = 3;
const TRUSTED_SCOPES = ["read:brain-truth:positioning", "read:brain-truth:governance"];

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: unknown }
  | { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

async function callClaude(system: string, messages: AnthropicMessage[]) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured.");

  const apiBase = (process.env.ANTHROPIC_API_BASE ?? "https://api.anthropic.com").replace(
    /\/+$/,
    "",
  );
  const startedAt = Date.now();
  const response = await fetch(`${apiBase}/v1/messages`, {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: resolveCurationModel(),
      max_tokens: 900,
      system,
      tools: CURATION_TOOLS,
      messages,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Curation request failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const data = (await response.json()) as {
    id?: string;
    model?: string;
    content?: AnthropicContentBlock[];
    stop_reason?: string;
    usage?: { input_tokens?: number; output_tokens?: number };
  };
  return {
    ...data,
    providerRequestId: response.headers.get("request-id") ?? undefined,
    latencyMs: Date.now() - startedAt,
  };
}

function trustedBlocksFromDocket(
  docket: Awaited<ReturnType<typeof loadCurationDocket>>,
): ContextBlock[] {
  return docket.trustedTruths.map((truth) => ({
    title: truth.title,
    text: truth.canonicalText,
    recordId: truth.recordId,
  }));
}

function buildProposal(
  toolName: CurationToolName,
  input: Record<string, unknown>,
  brainSlug: string,
): CurationProposal {
  const title =
    toolName === "propose_draft_truth" || toolName === "propose_truth_edit"
      ? String(input.title ?? "Proposed truth")
      : toolName === "promote_to_trusted"
        ? "Promote draft to Trusted"
        : toolName === "mark_no_action"
          ? "Mark interaction: no action"
          : toolName === "propose_quarantine"
            ? "Propose quarantine"
            : toolName === "route_intake_item"
              ? String(input.title ?? "Route intake item")
              : toolName;

  const summary =
    typeof input.canonicalText === "string"
      ? input.canonicalText.slice(0, 280)
      : typeof input.reason === "string"
        ? input.reason
        : JSON.stringify(input).slice(0, 280);

  const destination =
    (toolName === "propose_quarantine" || toolName === "mark_no_action") &&
    input.source === "household_activity"
      ? "household-activity"
      : toolDestination(toolName);

  return {
    id: `prop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    toolName,
    title,
    summary,
    destination,
    brainSlug,
    payload: input,
    status: "pending",
  };
}

export async function runCurationChat(
  input: CurationChatRequest,
): Promise<CurationChatResponse> {
  const message = input.message.trim();
  if (!message) throw new Error("message is required.");
  if (message.length > MAX_MESSAGE_LENGTH) {
    throw new Error(`Message must be ${MAX_MESSAGE_LENGTH} characters or fewer.`);
  }

  const docket = await loadCurationDocket(input.brainSlug);
  const trustedBlocks = trustedBlocksFromDocket(docket);
  const system = buildCurationSystemPrompt({ trustedBlocks, docket });

  const messages: AnthropicMessage[] = buildCurationMessages(input.history, message).map(    (turn) => ({
      role: turn.role,
      content: turn.content,
    }),
  );

  const proposals: CurationProposal[] = [];
  const modelCalls: Array<{
    requestedModel: string;
    returnedModel?: string;
    usage?: unknown;
    finishReason?: string;
    responseId?: string;
    providerRequestId?: string;
    latencyMs?: number;
  }> = [];
  let reply = "";

  for (let round = 0; round < MAX_TOOL_ROUNDS; round += 1) {
    const data = await callClaude(system, messages);
    modelCalls.push({
      requestedModel: resolveCurationModel(),
      returnedModel: data.model,
      usage: data.usage,
      finishReason: data.stop_reason,
      responseId: data.id,
      providerRequestId: data.providerRequestId,
      latencyMs: data.latencyMs,
    });
    const content = data.content ?? [];
    reply =
      content
        .filter((block): block is { type: "text"; text: string } => block.type === "text")
        .map((block) => block.text)
        .join("\n")
        .trim() || reply;

    const toolUses = content.filter(
      (block): block is Extract<AnthropicContentBlock, { type: "tool_use" }> =>
        block.type === "tool_use",
    );

    if (data.stop_reason !== "tool_use" || toolUses.length === 0) break;

    const toolResults: AnthropicContentBlock[] = [];

    for (const toolUse of toolUses) {
      const toolName = toolUse.name as CurationToolName;
      const parsed = parseToolInput(toolName, toolUse.input);
      if (toolName === "propose_quarantine" || toolName === "mark_no_action") {
        const matched = docket.flaggedInteractions.some(
          (item) => item.recordId === parsed.recordId && item.source === parsed.source,
        );
        if (!matched) {
          throw new Error("Interaction proposal did not match a source-qualified docket record.");
        }
      }

      if (toolName === "get_pending_docket") {
        toolResults.push({
          type: "text",
          text: JSON.stringify({
            drafts: docket.drafts.length,
            flaggedInteractions: docket.flaggedInteractions.length,
            pendingSourceDocuments: docket.pendingSourceDocuments.length,
          }),
        });
        continue;
      }

      if (toolName === "get_trusted_truths") {
        toolResults.push({
          type: "text",
          text: JSON.stringify(docket.trustedTruths.slice(0, 20)),
        });
        continue;
      }

      proposals.push(buildProposal(toolName, parsed, input.brainSlug));
      toolResults.push({
        type: "text",
        text: JSON.stringify({
          status: "proposal_created",
          message: "Awaiting Architect confirmation in the UI.",
        }),
      });
    }

    messages.push({ role: "assistant", content });
    messages.push({
      role: "user",
      content: toolUses.map((toolUse, index) => ({
        type: "tool_result" as const,
        tool_use_id: toolUse.id,
        content:
          toolResults[index]?.type === "text"
            ? toolResults[index].text
            : "Proposal queued for confirmation.",
      })),
    });
  }

  const trustedSnippets = (
    await Promise.all(
      TRUSTED_SCOPES.map((scope) =>
        retrieveTrustedSnippets({ brainSlug: input.brainSlug, scope }),
      ),
    )
  ).flat();

  const knowledgeSource =
    docket.mode === "airtable" && docket.trustedTruths.some((t) => !t.recordId.startsWith("fallback"))
      ? "airtable"
      : "fallback";

  const manifest = buildCurationGroundingManifest({
    brainSlug: input.brainSlug,
    trustedSnippets,
    docket,
    source: knowledgeSource,
  });

  const platformManifest: PlatformRouteManifest = {
    kind: "mixed",
    recordIds: [
      ...new Set([
        ...trustedSnippets.map((snippet) => snippet.recordId),
        ...docket.trustedTruths.map((item) => item.recordId),
        ...docket.drafts.map((item) => item.recordId),
        ...docket.flaggedInteractions.map((item) => item.recordId),
        ...docket.pendingSourceDocuments.map((item) => item.recordId),
      ]),
    ],
    urls: [],
    promptVersion: "curation-chat-v1",
    source: `curation-docket:${knowledgeSource}`,
  };

  if (modelCalls.length > 0) {
    const first = modelCalls[0];
    await queueTurnWithModelCall({
      handle: input.platformHandle ?? null,
      turnId: input.turnId ?? input.sessionId,
      surface: "curation",
      persona: "clive",
      brainSlug: input.brainSlug,
      userMessage: message,
      assistantReply: reply || "…",
      manifest: platformManifest,
      ...first,
      callIndex: 0,
    }).catch(() => undefined);
    await Promise.all(
      modelCalls.slice(1).map((call, index) =>
        queueChildModelCall({
          handle: input.platformHandle ?? null,
          turnId: input.turnId ?? input.sessionId,
          surface: "curation",
          manifest: platformManifest,
          ...call,
          callIndex: index + 1,
        }).catch(() => undefined),
      ),
    );
  }

  void handleInteractionLog({
    sessionId: input.sessionId,
    persona: "clive",
    brainSlug: input.brainSlug,
    userMessage: message,
    assistantReply: reply || "…",
    channel: "website",
    manifest: {
      recordIds: extractManifestRecordIds(manifest),
      hashes: [],
      grantId: "",
      retrievedAt: new Date().toISOString(),
    },
  }).catch(() => undefined);

  return {
    reply: reply || "I'm here — what shall we curate?",
    proposals,
    groundingManifest: serialiseGroundingManifest(manifest),
    knowledgeSource,
  };
}

export function sanitiseCurationHistory(raw: unknown) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (item): item is { role: "user" | "assistant"; content: string } =>
        typeof item === "object" &&
        item !== null &&
        (item.role === "user" || item.role === "assistant") &&
        typeof item.content === "string" &&
        item.content.trim().length > 0,
    )
    .slice(-10)
    .map((item) => ({ role: item.role, content: item.content.trim().slice(0, MAX_MESSAGE_LENGTH) }));
}
