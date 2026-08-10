/** Server-only context-index config. Never import from client components. */

function envBoolean(name: string, fallback = false): boolean {
  const raw = process.env[name];
  if (raw === "true" || raw === "1") return true;
  if (raw === "false" || raw === "0") return false;
  return fallback;
}

/** Off by default — requires Neon + Trusted Brain read token + OpenAI embeddings. */
export function contextIndexSyncEnabled(): boolean {
  return envBoolean("CONTEXT_INDEX_SYNC_ENABLED");
}

export function getContextIndexDatabaseUrl(): string | undefined {
  return process.env.DATABASE_URL;
}

export function getContextIndexEmbeddingModel(): string {
  return process.env.CONTEXT_INDEX_EMBEDDING_MODEL ?? "text-embedding-3-small";
}

export function getOpenAiApiKey(): string | undefined {
  return process.env.OPENAI_API_KEY;
}
