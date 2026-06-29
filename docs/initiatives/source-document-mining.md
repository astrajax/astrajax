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

Routine mine batches can digest rather than per-row human gates. Escalate when Challenger flags sensitivity, category overflow, or empty/ low-quality summaries.

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

1. **Open** AstraJax Brain Workshop → **Source Documents**.
2. **Create row:** set **Title**, attach file in **Attachment**, set **Brain Slug** (default `astrajax-chapter-1`), **Created By** = Matthew.
3. **Convert Attachment Summary to AI summarise** (one-time base setup if not done): field type = Airtable AI summarise, source = **Attachment**. See `brain-key-schema.md` § Source Documents.
4. **Run summarise** on the row (Airtable AI button / refresh) — wait until summary text appears.
5. **Set Mine Status** to **Summarised** when the summary is good enough to mine (or use automation later — not V1).
6. **Invoke mine** — `POST /api/brains/source-documents/mine` (or `@clive-man` workflow calling the route).
7. **Review** linked **Draft Brain Truth** rows in Workshop; edit, reject, or send through normal human approval + Doc promote.
8. To ignore a file: set **Mine Status** = **Skipped** (mine route will not pick it up).

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
