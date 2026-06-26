export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AskCliveRequest = {
  message: string;
  history?: ChatMessage[];
  /** Stable browser session for Brain Interactions logging. */
  sessionId?: string;
};

export type AskCliveResponse = {
  reply: string;
  contextSource: "trusted" | "fallback";
  interactionLogged?: boolean;
};

export type ContextBlock = {
  title: string;
  text: string;
  category?: string;
};
