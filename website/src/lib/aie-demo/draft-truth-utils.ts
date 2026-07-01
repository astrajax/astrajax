const TRUSTED_SCOPE_PATTERN = /^read:brain-truth:[a-z0-9-]+$/;

export function scopeForDraft(draft: {
  brainTheme?: string;
  proposedCategory?: string;
  scope?: string;
}): string {
  if (draft.scope && TRUSTED_SCOPE_PATTERN.test(draft.scope)) {
    return draft.scope;
  }
  const theme = (draft.brainTheme ?? "").toLowerCase();
  if (theme.includes("govern")) return "read:brain-truth:governance";
  return "read:brain-truth:positioning";
}

export function categoryForPromote(proposedCategory?: string): string {
  const cat = proposedCategory?.trim();
  if (!cat) return "Definition";
  if (cat === "Knowledge" || cat === "Open Questions") return "Definition";
  return cat;
}
