import { airtableCreate } from "../airtable-rest";
import {
  BRAIN_TRUSTED_CHAPTER1_BASE_ID,
  BRAIN_TRUSTED_CHAPTER1_TABLES,
  CHAPTER1_BRAIN_SLUG,
} from "../airtable-ids";
import { appendChangeLog } from "../change-log";
import { getDocPromoteToken, getWorkshopWriteToken, useMemoryStore } from "../config";
import { createDraftTruth } from "./draft-propose";

export type DemoSeedTruth = {
  title: string;
  canonicalText: string;
  category: string;
  scope: string;
};

export const ASTRAJAX_DEMO_TRUTHS: DemoSeedTruth[] = [
  {
    title: "What AstraJax is",
    canonicalText:
      "AstraJax is the AI command centre for operators. It helps non-technical founders, commercial leaders, and function experts build with AI, reason with AI, and adopt agent fleets their teams actually use.",
    category: "Positioning",
    scope: "read:brain-truth:positioning",
  },
  {
    title: "Public line",
    canonicalText: "AstraJax. AI that actually gets used.",
    category: "Positioning",
    scope: "read:brain-truth:positioning",
  },
  {
    title: "Trinity pattern",
    canonicalText:
      "Clive reasons. Pam challenges. The Architect decides. Doc acts. Agents propose; humans approve; every step leaves a paper trail.",
    category: "Governance",
    scope: "read:brain-truth:governance",
  },
  {
    title: "Workshop vs Trusted",
    canonicalText:
      "Every new idea begins in the Workshop draft bench. When satisfied something is genuinely true, the Architect approves it into the Trusted Brain — the approved context agents may rely on.",
    category: "Governance",
    scope: "read:brain-truth:governance",
  },
  {
    title: "What AstraJax is not",
    canonicalText:
      "AstraJax is not generic AI consulting, a lead-gen shop, or Matthew building Airtable bases for hire. It is an owned venture helping commercial teams turn domain expertise into AI-ready operating systems.",
    category: "Positioning",
    scope: "read:brain-truth:positioning",
  },
];

export async function handleDemoSeed(input: {
  brainSlug?: string;
  actor?: string;
  includeDrafts?: boolean;
}): Promise<{
  mode: "airtable" | "memory";
  trustedRecordIds: string[];
  draftRecordIds: string[];
}> {
  const brainSlug = input.brainSlug?.trim() || CHAPTER1_BRAIN_SLUG;
  const actor = input.actor?.trim() || "Demo seed";
  const token = getDocPromoteToken() ?? getWorkshopWriteToken();
  const trustedBaseId = process.env.BRAIN_TRUSTED_BASE_ID ?? BRAIN_TRUSTED_CHAPTER1_BASE_ID;
  const trustedTableId =
    process.env.BRAIN_TRUSTED_TRUTH_TABLE_ID ?? BRAIN_TRUSTED_CHAPTER1_TABLES.brainTruth;
  const today = new Date().toISOString().slice(0, 10);

  const trustedRecordIds: string[] = [];
  const draftRecordIds: string[] = [];

  if (useMemoryStore() || !token) {
    for (const truth of ASTRAJAX_DEMO_TRUTHS) {
      trustedRecordIds.push(`mem_seed_${truth.title.toLowerCase().replace(/\s+/g, "-")}`);
    }
    if (input.includeDrafts) {
      const draft = await createDraftTruth({
        brainSlug,
        title: "Open question: first paid pilot shape",
        canonicalText:
          "Demo draft — what does the first paid AstraJax engagement look like after Chapter 1?",
        proposedCategory: "Open Questions",
        proposedByAgent: "Clive's Man",
        actor,
      });
      draftRecordIds.push(draft.recordId);
    }
    return { mode: "memory", trustedRecordIds, draftRecordIds };
  }

  for (const truth of ASTRAJAX_DEMO_TRUTHS) {
    const created = await airtableCreate(trustedBaseId, trustedTableId, token, {
      Title: truth.title,
      "Canonical Text": truth.canonicalText,
      Category: truth.category,
      Scope: truth.scope,
      Authority: actor,
      Freshness: "Current",
      "Last Reviewed": today,
    });
    trustedRecordIds.push(created.id);
  }

  if (input.includeDrafts) {
    const draft = await createDraftTruth({
      brainSlug,
      title: "Open question: first paid pilot shape",
      canonicalText:
        "Demo draft — what does the first paid AstraJax engagement look like after Chapter 1?",
      proposedCategory: "Open Questions",
      proposedByAgent: "Clive's Man",
      actor,
    });
    draftRecordIds.push(draft.recordId);
  }

  try {
    await appendChangeLog({
      changeSummary: `Demo seed: ${trustedRecordIds.length} trusted truth(s) for ${brainSlug}`,
      changeType: "Demo Seed",
      changedBy: actor,
      executingAgent: "Clive's Man",
      reason: "Bootstrap AstraJax demo brain data",
      affectedRecords: trustedRecordIds.join(", "),
      source: "Demo seed API",
    });
  } catch {
    /* non-blocking */
  }

  return { mode: "airtable", trustedRecordIds, draftRecordIds };
}
