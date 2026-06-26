export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type ClivePersona = "clive" | "pam";

export type AskCliveRequest = {
  message: string;
  history?: ChatMessage[];
  /** Stable browser session for Brain Interactions logging. */
  sessionId?: string;
  /** Which character speaks — defaults to Clive. */
  persona?: ClivePersona;
  /** Chapter 1 loop beat for governed context and fallback routing. */
  beat?: string;
  /** Extra loop context (user brain label, draft summary) — never trusted truth. */
  loopContext?: string;
  /** Request a streaming plain-text response. */
  stream?: boolean;
};

export type AskCliveResponse = {
  reply: string;
  contextSource: "trusted" | "fallback";
  interactionLogged?: boolean;
  fallback?: boolean;
};

export type ContextBlock = {
  title: string;
  text: string;
  category?: string;
};
