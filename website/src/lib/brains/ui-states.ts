import type { AccessGrant, BrainKeyRequest, BrainKeyUiState } from "./types";

export interface BrainKeyUiContext {
  brainSlug: string;
  brainName?: string;
  maturity?: string;
  request?: BrainKeyRequest;
  grant?: AccessGrant;
  promotionPending?: boolean;
}

export function deriveBrainKeyUiState(ctx: BrainKeyUiContext): BrainKeyUiState {
  if (ctx.promotionPending) return "promotion_pending";

  if (ctx.grant) {
    if (ctx.grant.status === "active" && new Date(ctx.grant.expiresAt) > new Date()) {
      if (ctx.grant.useCount < ctx.grant.maxUses) return "unlocked";
    }
    return "expired";
  }

  if (!ctx.request) return "locked";

  switch (ctx.request.status) {
    case "pending":
      return "awaiting_approval";
    case "approved":
      return "awaiting_approval";
    case "rejected":
      return "locked";
    case "expired":
      return "expired";
    default:
      return "locked";
  }
}

/** User-facing labels — say "approved context", not Brain Key. */
export const UI_STATE_LABELS: Record<BrainKeyUiState, string> = {
  locked: "Workshop only",
  key_requested: "Context access requested",
  pam_challenge: "Pam sniff test (action gates only)",
  awaiting_approval: "Awaiting your approval",
  unlocked: "Approved context available",
  expired: "Context access expired",
  promotion_pending: "Doc promotion in progress",
};

export const UI_STATE_COPY: Record<BrainKeyUiState, string> = {
  locked:
    "Seedling Brain — Clive and Pam work with workshop drafts only. Approved context lives in a separate Trusted Brain base until you promote it.",
  key_requested: "An agent has asked to use approved context for a bounded task.",
  pam_challenge:
    "Pam stress-tests high-stakes decisions — canonical approval, Doc handoff, deploy. Not used for routine context retrieval.",
  awaiting_approval:
    "Review purpose, scope, and reason — then approve or reject context access for this task.",
  unlocked:
    "Approved snippets are available for this session. Access was scoped, time-limited, and logged. Agents never see credentials.",
  expired: "This access grant has expired or been used up. Request fresh approval to continue.",
  promotion_pending: "Doc is promoting approved draft context into the Trusted Brain.",
};

export function cliveMessageForState(state: BrainKeyUiState): string {
  switch (state) {
    case "locked":
      return "I can help from workshop drafts. Once the brain reaches Working maturity and you approve context for a task, I can use approved snippets — scoped and logged.";
    case "key_requested":
    case "awaiting_approval":
      return "I've asked to use approved context for this task. I can't see it until you approve — and I won't retain access after the grant expires.";
    case "unlocked":
      return "Thank you — I can use the approved snippets for this task. When access expires, I'll be blind again.";
    case "expired":
      return "Context access has expired. Shall we request approval again?";
    case "promotion_pending":
      return "Doc is handling the promotion. I'll stay out of the trusted store until that's done.";
    default:
      return "";
  }
}

/** Demo header when brain has not yet reached Working maturity. */
export const SEEDLING_HEADER_LABEL = "Seedling Brain · Workshop only";
