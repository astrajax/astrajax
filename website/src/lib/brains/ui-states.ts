import type { BrainKeyRequest, BrainKeyUiState, AccessGrant } from "./types";

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

export const UI_STATE_LABELS: Record<BrainKeyUiState, string> = {
  locked: "Trusted Brain locked",
  key_requested: "Brain Key requested",
  pam_challenge: "Pam sniff test (action gates only — not Brain Key unlock)",
  awaiting_approval: "Awaiting your approval",
  unlocked: "Brain unlocked for this task",
  expired: "Brain Key expired",
  promotion_pending: "Doc promotion in progress",
};

export const UI_STATE_COPY: Record<BrainKeyUiState, string> = {
  locked:
    "Clive and Pam can work in the workshop with drafts only. Trusted context stays locked until you approve a Brain Key.",
  key_requested: "An agent has asked to unlock approved context for a bounded task.",
  pam_challenge:
    "Pam stress-tests high-stakes decisions — canonical approval, Doc handoff, deploy. Not used when unlocking read access.",
  awaiting_approval: "Review scope, reason, and expiry — then approve or reject the Brain Key.",
  unlocked: "Approved snippets are available for this session. The key itself is never shown to agents.",
  expired: "This grant has expired or been used up. Request a new Brain Key to continue.",
  promotion_pending: "Doc is promoting approved draft context into the Trusted Brain.",
};

export function cliveMessageForState(state: BrainKeyUiState): string {
  switch (state) {
    case "locked":
      return "I can help from workshop drafts, but I’ll need you to approve a Brain Key before I can read trusted context.";
    case "key_requested":
    case "awaiting_approval":
      return "I’ve asked for the Brain Key. I can’t see trusted context until you approve — and I won’t remember the key afterwards.";
    case "unlocked":
      return "Thank you — I can use the approved snippets for this task. When the grant expires, I’ll be blind again.";
    case "expired":
      return "The Brain Key has expired. Shall we request a fresh one?";
    case "promotion_pending":
      return "Doc is handling the promotion. I’ll stay out of the trusted store until that’s done.";
    default:
      return "";
  }
}
