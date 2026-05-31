export type ChatRole = "user" | "assistant";

export type ChatMessage = {
  role: ChatRole;
  content: string;
};

export type AskCliveRequest = {
  message: string;
  history?: ChatMessage[];
};

export type AskCliveResponse = {
  reply: string;
  contextSource: "airtable" | "fallback";
};

export type ContextBlock = {
  title: string;
  text: string;
  category?: string;
};
