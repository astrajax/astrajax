export const HOUSEHOLD_ACTIVITY_BASE_ID = "appF7jQD4ZKrDC7e1";
export const HOUSEHOLD_SESSIONS_TABLE_ID = "tblUi4nmBKX2u8nFx";
export const HOUSEHOLD_ACTIVITY_TABLE_ID = "tblNxNLyC31KDQbRl";

export const HOUSEHOLD_SESSION_FIELDS = {
  sessionId: "fldHTqDQeAEqE4JCb",
  parentSessionId: "fldVFuT8AHFFU28al",
  rootSessionId: "fld5OjB9QLjNTgsKT",
  agentSlug: "fldzed2cCR3HyCCOb",
  agentName: "fld4jizroZZZVxDtb",
  runtime: "fldoE8uXllbSMAPPS",
  trigger: "fldG3t3bCjY8tklgv",
  user: "fldMg0dpNURUNEkWW",
  started: "fldTOGhUjtylNV4ll",
  threadUrl: "fldqEN6EC48KcsZrS",
  model: "fld5Rjoxc2q5hxR4R",
} as const;

export const HOUSEHOLD_ACTIVITY_FIELDS = {
  summary: "fldoVtBIAKanaafMg",
  eventId: "fldxIVVOp7VvfVQ5j",
  sequence: "fldeQ8SjlrZfj3a6M",
  sessionId: "fldz1skahzUvg1vzX",
  sessionLink: "fldRD3GFz3PqYTANC",
  /** Agent Turn Type — mechanical event_type writes. User Turn Type (fldTCd93…) is AI-owned. */
  eventType: "fldvskIDzutu4JzQt",
  timestamp: "fldTl7rXvf7YHgImz",
  userMessage: "fldzSTdm15GQf88Ph",
  replyDigest: "fldBj92Hu9gDesX6u",
  contextReferenced: "fldkSONM4RjGmHjZT",
  detail: "fldjXdEnPfc6BeKqv",
  outcome: "fldYYSYt5yVgN8dc1",
  targetUrl: "fld76GAzl1Q0Brqux",
  model: "fldXYLfw560tuXFk8",
  reviewStatus: "fldCtTcdklAcDa9tW",
  humanQuality: "fldlKDwCGDAj6fah5",
  agentQuality: "fldLExhD3nr41nir6",
  tokensIn: "fldoPEuPYgLCsbYgz",
  tokensOut: "fldmGBFPPUouTtn5Y",
  costUsd: "fldyk34Wd33W2xofh",
} as const;
