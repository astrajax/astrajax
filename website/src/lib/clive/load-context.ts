import { FALLBACK_CONTEXT } from "./fallback-context";
import type { ContextBlock } from "./types";

const BASE_ID = "appYv601Oq7fKTCj0";
const CONTEXT_ITEMS_TABLE = "tblisiZJQmQuBqEef";
const CACHE_TTL_MS = 5 * 60 * 1000;

type AirtableRecord = {
  fields?: {
    Title?: string;
    "Canonical Text"?: string;
    Category?: string;
    "Applies To"?: string[];
    Status?: string;
  };
};

let cachedBlocks: ContextBlock[] | null = null;
let cachedAt = 0;
let cachedSource: "airtable" | "fallback" = "fallback";

function isWebsiteRelevant(fields: NonNullable<AirtableRecord["fields"]>): boolean {
  const applies = fields["Applies To"] ?? [];
  return applies.some((tag) => tag === "AstraJax" || tag === "Clive");
}

function mapRecord(record: AirtableRecord): ContextBlock | null {
  const fields = record.fields;
  if (!fields?.Title || !fields["Canonical Text"]) return null;
  return {
    title: fields.Title,
    text: fields["Canonical Text"],
    category: fields.Category,
  };
}

async function fetchApprovedFromAirtable(token: string): Promise<ContextBlock[]> {
  const formula = encodeURIComponent("{Status}='Approved'");
  const fieldParams = ["Title", "Canonical Text", "Category", "Applies To", "Status"]
    .map((name) => `fields[]=${encodeURIComponent(name)}`)
    .join("&");
  const url = `https://api.airtable.com/v0/${BASE_ID}/${CONTEXT_ITEMS_TABLE}?filterByFormula=${formula}&${fieldParams}&pageSize=100`;

  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`Airtable ${response.status}`);
  }

  const data = (await response.json()) as { records?: AirtableRecord[] };
  const blocks = (data.records ?? [])
    .filter((record) => record.fields && isWebsiteRelevant(record.fields))
    .map(mapRecord)
    .filter((block): block is ContextBlock => block !== null);

  return blocks.length > 0 ? blocks : FALLBACK_CONTEXT;
}

export async function loadCliveContext(): Promise<{
  blocks: ContextBlock[];
  source: "airtable" | "fallback";
}> {
  const now = Date.now();
  if (cachedBlocks && now - cachedAt < CACHE_TTL_MS) {
    return { blocks: cachedBlocks, source: cachedSource };
  }

  const token = process.env.AIRTABLE_READ_TOKEN;
  if (!token) {
    cachedBlocks = FALLBACK_CONTEXT;
    cachedSource = "fallback";
    cachedAt = now;
    return { blocks: cachedBlocks, source: cachedSource };
  }

  try {
    const blocks = await fetchApprovedFromAirtable(token);
    cachedBlocks = blocks;
    cachedSource = "airtable";
    cachedAt = now;
    return { blocks, source: "airtable" };
  } catch {
    cachedBlocks = FALLBACK_CONTEXT;
    cachedSource = "fallback";
    cachedAt = now;
    return { blocks: cachedBlocks, source: cachedSource };
  }
}

export function formatContextForPrompt(blocks: ContextBlock[]): string {
  return blocks
    .map(
      (block) =>
        `### ${block.title}${block.category ? ` (${block.category})` : ""}\n${block.text}`,
    )
    .join("\n\n");
}
