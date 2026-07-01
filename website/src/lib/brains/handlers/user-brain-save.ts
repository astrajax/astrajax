import { getWorkshopBaseId, getWorkshopWriteToken } from "../config";
import { BRAIN_WORKSHOP_TABLES } from "../airtable-ids";
import { airtableCreate } from "../airtable-rest";

export type UserBrainSaveBody = {
  sessionId: string;
  name?: string;
  role?: string;
  goal?: string;
  profileLabel?: string;
  aiConfidence?: "new" | "comfortable" | "expert";
  contextConfidence?: "new" | "comfortable" | "expert";
  classificationSummary?: string;
  guideMode?: string;
};

function mapConfidence(level?: "new" | "comfortable" | "expert"): string | undefined {
  if (!level) return undefined;
  if (level === "new") return "New";
  if (level === "expert") return "Expert";
  return "Comfortable";
}

function mapGuideMode(mode?: string): string | undefined {
  if (!mode) return "Full Story";
  if (mode === "light_story") return "Light Story";
  if (mode === "no_story") return "No Story";
  return "Full Story";
}

export async function handleUserBrainSave(body: UserBrainSaveBody) {
  if (!body.sessionId?.trim()) throw new Error("sessionId is required.");

  const workshopBaseId = getWorkshopBaseId();
  const workshopToken = getWorkshopWriteToken();
  const tableId =
    process.env.BRAIN_WORKSHOP_USER_BRAINS_TABLE_ID ?? BRAIN_WORKSHOP_TABLES.userBrains;

  const label = body.name?.trim() || `Session ${body.sessionId.slice(0, 8)}`;
  const notes = [
    body.classificationSummary?.trim(),
    body.role?.trim() ? `Role: ${body.role.trim()}` : "",
    `Chapter 1 session: ${body.sessionId}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const fields: Record<string, string> = {
    "User Label": label,
    Notes: notes,
    "Guide Mode": mapGuideMode(body.guideMode) ?? "Full Story",
  };

  if (body.goal?.trim()) fields["One Line Remit"] = body.goal.trim();
  if (body.profileLabel?.trim()) fields["Development Notes"] = body.profileLabel.trim();
  const ai = mapConfidence(body.aiConfidence);
  const ctx = mapConfidence(body.contextConfidence);
  if (ai) fields["AI Confidence"] = ai;
  if (ctx) fields["Context Environment Confidence"] = ctx;

  if (!workshopBaseId || !workshopToken) {
    return {
      mode: "fallback" as const,
      saved: false,
      message:
        "Workshop User Brains not wired (BRAIN_WORKSHOP_WRITE_TOKEN). Intake stays in this browser session only.",
    };
  }

  const record = await airtableCreate(workshopBaseId, tableId, workshopToken, fields);

  return {
    mode: "airtable" as const,
    saved: true,
    recordId: record.id,
    userLabel: label,
  };
}
