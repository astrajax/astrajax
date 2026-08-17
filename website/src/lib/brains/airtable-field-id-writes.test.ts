/**
 * Regression: Airtable write payloads in website/ must key on field IDs.
 *
 * On 17 Aug 2026 a Draft column rename (`Canonical Text` → `Canonical Text for
 * Agents`) silently broke every name-keyed capture write. Matthew kept this
 * test wide — quoted display-name keys in production source fail it.
 *
 * `filterByFormula` / `sort` still use display names (Airtable refuses IDs
 * there). Those live in formula strings and `*_FIELD_NAMES` maps, not as
 * `"Field Name": value` write keys.
 */

import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { describe, expect, it } from "vitest";

const WEBSITE_SRC = join(__dirname, "../..");

/** Quoted display-name keys that must never appear as write-payload keys. */
const FORBIDDEN_WRITE_KEY_PATTERNS: RegExp[] = [
  /"(Canonical Text|Canonical Text for Agents|Canonical Text for Humans)"\s*:/,
  /"(Brain Slug|Brain Registry|Proposed Category|Proposed By Agent|Created By|Capture Source)"\s*:/,
  /"(Source Documents|Context Amendment Versions|Related Projects|Supersedes Trusted Truth ID)"\s*:/,
  /"(Request ID|Grant ID|Entry ID|Change Summary|Change Type|Changed By|Approved By|Executing Agent|Affected Records|Previous Hash|Entry Hash|Session ID|Max Uses|Use Count)"\s*:/,
  /"(User Label|One Line Remit|Guide Mode|AI Confidence|Context Environment Confidence|Development Notes)"\s*:/,
  /"(Operator ID|Journey Chapter|Journey Step|Completed Chapters|Owned Brain Slugs|Configured Functions|Introduced Members|Last Safe Destination|Updated At)"\s*:/,
  /"(Quality Score|Review Status|Context Flagged|Review Notes|Reviewed At|Suspected Context Issue|Agent Quality|Human Quality)"\s*:/,
  /"(Decision ID|Decision Summary|Decision Notes|Send to Doc|Interaction ID|User Message|Assistant Reply|Manifest Record IDs|Manifest Hashes)"\s*:/,
  /"(Last Reviewed)"\s*:/,
];

function walkTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    if (name === "node_modules" || name === ".next") continue;
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      out.push(...walkTsFiles(full));
      continue;
    }
    if (!name.endsWith(".ts") && !name.endsWith(".tsx")) continue;
    if (name.endsWith(".test.ts") || name.endsWith(".test.tsx")) continue;
    out.push(full);
  }
  return out;
}

function stripAllowedNameMaps(source: string): string {
  return source
    .replace(/export const DRAFT_TRUTH_FIELD_NAMES[\s\S]*?as const;/g, "")
    .replace(/export const OPERATOR_STATE_FIELD_NAMES[\s\S]*?as const;/g, "")
    .replace(/export const [A-Z0-9_]*FIELD_NAMES[\s\S]*?as const;/g, "")
    .replace(/export const SOURCE_DOCUMENT_AIRTABLE_FIELD_NAMES[\s\S]*?as const;/g, "");
}

describe("Airtable write payloads key on field IDs", () => {
  it("fails if any website/src production file uses a field-name write key", () => {
    const offenders: string[] = [];
    for (const file of walkTsFiles(WEBSITE_SRC)) {
      const source = stripAllowedNameMaps(readFileSync(file, "utf8"));
      for (const pattern of FORBIDDEN_WRITE_KEY_PATTERNS) {
        if (pattern.test(source)) {
          offenders.push(`${relative(WEBSITE_SRC, file)} matches ${pattern}`);
        }
      }
    }

    expect(offenders, offenders.join("\n")).toEqual([]);
  });
});
