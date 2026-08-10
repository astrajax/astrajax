import { neon, type NeonQueryFunction } from "@neondatabase/serverless";
import { getContextIndexDatabaseUrl } from "./config";

let cached: NeonQueryFunction<false, false> | null = null;

export function getContextIndexSql(): NeonQueryFunction<false, false> {
  if (cached) return cached;
  const url = getContextIndexDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is not configured.");
  }
  cached = neon(url);
  return cached;
}

/** pgvector accepts a literal like [0.1,0.2,...] */
export function toVectorLiteral(values: number[]): string {
  return `[${values.join(",")}]`;
}
