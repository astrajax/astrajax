# Source Document Mining — V1 (Clive's Man)

**Status:** V1 shipped (29 Jun 2026) — Matthew approved Pam Revise gates  
**Owner:** Matthew  
**Canonical architecture:** [`docs/business/architecture.md`](../business/architecture.md) §4 Clive's Man  
**Schema:** [`brain-key-schema.md`](./brain-key-schema.md) § Source Documents  
**Wiring:** [`brain-key-wiring.md`](./brain-key-wiring.md) § Source document mining  
**Live IDs:** [`website/src/lib/brains/airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts)

---

## Purpose

Workshop **Source Documents** hold uploaded files (PDFs, decks, notes) that may contain durable brain material. V1 does **not** auto-mine on upload. Matthew uploads → Airtable summarises the attachment → Clive's Man reads the **summary only** and proposes **Draft Brain Truth** rows for human review. Nothing becomes Trusted without the existing Doc promote + human approval path.

```text
Upload (Matthew) → Airtable AI summary → Mine Status = Summarised
        → Clive's Man POST /api/brains/source-documents/mine
        → Draft Brain Truth (Workshop) + Mine Status = Proposed
        → Human review → Doc promote → Trusted (separate flow)
```

---

## Website onboarding intake (19 Aug 2026)

Files uploaded during `/onboarding` — both "Bring your material" and the optional
supporting file on "Talk it through" — now arrive as **Source Documents** rows
automatically. Nothing about the gates above changes: rows land **Pending**, no
summary, and the website never calls the mine route.

```text
Browser → private Vercel Blob (staging, onboarding-uploads/)
        → POST /api/onboarding/source-document (staging key only, no bytes)
        → server mints a short-lived signed GET URL for that private blob
        → Source Documents row (Title = filename, Mine Status = Pending,
           Created By = Website, Brain Slug = astrajax-chapter-1)
           with Attachment = [{ url: signedUrl, filename }]
        → Airtable GETs the signed URL and copies the file into the cell
        → staging blob deleted once the attachment is confirmed
        → [unchanged] Matthew summarises → Summarised → Clive's Man mines
```

**Storage decision:** Airtable Source Documents is the durable home; private Blob
is temporary staging (never made public). Filing never streams file bytes through
Next.js and never uses Airtable's 5 MB base64 `uploadAttachment` path. One signed-URL
attach path covers every Source Pack size (up to the existing 20 MB / file cap).
Deletion happens **only after** Airtable confirms the attachment, so any failure
leaves the staged blob intact and retryable. A retry attaches to the row created by
the earlier attempt rather than filing twice.

**Honest failure states:** if the Workshop write token is missing, if signed-URL
minting fails, or if Airtable cannot fetch/attach the file, the route returns
`saved: false` with the reason and the Source Pack row reads "uploaded, not filed"
with a Retry filing action. It never looks successful and never tells anyone to
attach by hand (clients do not have Airtable).

**Still Matthew's manual step:** converting **Attachment Summary** to an Airtable
AI summarise field in the Airtable UI (MCP cannot create `aiText`). Until that
exists, filed rows stay Pending and no mining is possible — which is the intended
gate, not a bug.

**Code:** `website/src/lib/brains/handlers/onboarding-source-document.ts`,
`website/src/app/api/onboarding/source-document/route.ts`,
`website/src/lib/onboarding/upload-path.ts`.

---

## Pam V1 gates (non-negotiable)

| # | Gate | V1 behaviour |
|---|------|----------------|
| 1 | **Source Documents table** | Attachment + **Attachment Summary** + **Mine Status** (`Pending` → `Summarised` → `Proposed` → `Skipped`) |
| 2 | **Summary only in agent loop** | Clive's Man never re-reads **Attachment** in V1 — only **Attachment Summary** text |
| 3 | **Draft only** | Proposes **Draft Brain Truth** rows with `Status = Draft` — never writes Trusted Brain |
| 4 | **Category ceiling** | **Definition**, **Knowledge**, **Open Questions** only |
| 5 | **Gaps → Open Questions** | Uncertainty, TBD, or thin evidence must not land as Definition |
| 6 | **Sensitivity** | Workshop only; enablement not surveillance — same framing as Operator Development (`architecture.md` Step 0C) |
| 7 | **Eligibility** | Mine only when **Mine Status = Summarised** and summary is non-empty — not `Proposed` or `Skipped` |

**Hard stops:** no auto-mine on upload; no Trusted writes; no attachment fetch in the mine handler.

---

## Mine Status workflow

| Status | Meaning | Who sets it |
|--------|---------|-------------|
| **Pending** | File uploaded; summary not ready | Default on create |
| **Summarised** | **Attachment Summary** populated | Airtable AI field (or Matthew pastes summary manually) |
| **Proposed** | Clive's Man created linked Draft Brain Truth rows | Mine API after successful propose |
| **Skipped** | Matthew opted out of mining this file | Matthew in Airtable UI |

Clive's Man does not set **Summarised** — that is the human/Airtable AI step before mining.

---

## Category ceiling and structuring

V1 proposals use a simple structurer in `website/src/lib/brains/source-document-mining.ts`:

- If the summary uses `## Definition`, `## Knowledge`, or `## Open Questions` headers — sections map to those categories (subject to gate 5).
- Otherwise paragraphs are classified: uncertainty markers → **Open Questions**; definition-like phrasing → **Definition**; else **Knowledge**.
- Any category outside the V1 ceiling is rejected at write time.

Gaps and “we don't know yet” copy must become **Open Questions**, not Definition — Pam gate 5.

---

## Trinity (Clive's Man)

For each mine run (non–dry-run):

1. **Proposer** — structures draft candidates from summary text with evidence = source row ID + summary excerpt.
2. **Challenger** — verifies category ceiling, summary-only input, no Trusted write, eligible Mine Status.
3. **Executor** — calls mine API or handler; writes Workshop only.

**Default (Track 5):** Routine mine batches **must** digest rather than per-row human gates. Clive's Man returns one pack of Draft proposals. Escalate when Challenger flags sensitivity, category overflow, or empty/low-quality summaries. Per-row approval theatre for routine Green rows is a governance failure mode (Household Conduct).

---

## API

### `POST /api/brains/source-documents/mine`

**Auth:** Server-side `BRAIN_WORKSHOP_WRITE_TOKEN` only (same pattern as other Workshop brain routes — not exposed to browser/model).

```json
{
  "brainSlug": "astrajax-chapter-1",
  "limit": 5,
  "dryRun": false,
  "actor": "Matthew"
}
```

**Response:**

```json
{
  "mode": "airtable",
  "brainSlug": "astrajax-chapter-1",
  "dryRun": false,
  "eligibleCount": 1,
  "proposals": [
    {
      "title": "…",
      "canonicalText": "…",
      "proposedCategory": "Knowledge",
      "brainSlug": "astrajax-chapter-1",
      "sourceDocumentRecordId": "rec…"
    }
  ],
  "draftRecordIds": ["rec…"],
  "minedSourceDocumentIds": ["rec…"]
}
```

`dryRun: true` returns `proposals` without creating drafts or updating Mine Status.

---

## Matthew — manual steps in Airtable UI

Shrunk path (digest default):

1. **Upload** — Workshop → **Source Documents**: Title, Attachment, Brain Slug, Created By = Matthew.
2. **Summarise** — run Attachment Summary (Airtable AI); set **Mine Status** = **Summarised** when good enough (or **Skipped** to ignore).
3. **Digest review** — invoke mine via `@clive-man` / `POST /api/brains/source-documents/mine`; review the **digest** of Draft Brain Truth (not one gate per row). Edit, reject, or promote later through normal human approval + Doc.
4. One-time base setup if needed: Attachment Summary = AI summarise on Attachment (`brain-key-schema.md`).

---

## Code map

| Piece | Path |
|-------|------|
| Pam gates + structurer | `website/src/lib/brains/source-document-mining.ts` |
| Tests | `website/src/lib/brains/source-document-mining.test.ts` |
| Mine handler | `website/src/lib/brains/handlers/source-document-mine.ts` |
| Memory mode (tests) | `website/src/lib/brains/handlers/source-document-memory.ts` |
| API route | `website/src/app/api/brains/source-documents/mine/route.ts` |
| Live table/field IDs | `website/src/lib/brains/airtable-ids.ts` |

---

## Related

- [`brain-upkeep.md`](./brain-upkeep.md) — separate thin loop for Brain Interactions review
- [`.cursor/skills/clive-man/SKILL.md`](../../.cursor/skills/clive-man/SKILL.md) — Source Document Mining workflow section
