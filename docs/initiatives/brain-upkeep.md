# Brain Upkeep (thin scope)

> **Status:** Built (26 Jun 2026) — Pam red-team endorsed thin slice only.
> **Supersedes:** Full Brain Upkeep design proposal for anything marked deferred below.

## Why this exists

Client answer scoring landed first (`/brain/review`). Brain Upkeep adds a **Pam shortlist** and a **propose-only** loop so low-quality answers surface suspect context without anyone triaging every interaction or auto-editing Trusted truth.

## Built (thin scope)

### Part 1 — Needs Review shortlist (lite)

- **Surface:** `/brain/review` — **Needs review** tab (default view).
- **Filter:** Quality Score ≤ 2 **or** Suspected Context Issue = true; excludes Review Status = No action.
- **API:** `GET /api/brains/interactions/list?brainSlug=…&shortlist=true`
- **Each item shows:** question, answer, persona, Manifest Record IDs (when present), fallback notice when manifest is public fallback only.
- **Actions:** Propose context review · Propose quarantine · Dismiss (no action).
- **Storage:** Brain Interactions table in **Brain Workshop** base only (`appL2fdnGmhA02WXd`, `tblNqNSuIJ2akHyA1`). Reuses existing **Review Status** and **Context Flagged** fields — no new Airtable fields.

### Part 2 — Low score → propose only (lite)

- **Trigger:** Scoring 1–2 auto-sets Review Status = **Action proposed** and Context Flagged = **Flagged for review** (or **Quarantine proposed** when score = 1 and suspected context issue).
- **Policy:** Workshop proposal only. **Trusted Brain truth is never auto-edited** — including Freshness, Canonical Text, Authority, Scope, Category.
- **Manual propose:** `POST /api/brains/interactions/action` with `action: "propose" | "dismiss"`.
- **Clive's Man:** Documented in `.cursor/skills/clive-man*` — low score → propose review item; Executor may write Workshop interaction fields only; Trusted writes remain human-gated via `BRAIN_DOC_PROMOTE_TOKEN` promote route.
- **Brain Memories auto-curate:** **Not wired.** No Trusted Brain Memories write credential exists beyond Doc promote. Propose path only; flag for future wiring if `BRAIN_TRUSTED_*` steward token is added under Pam review.

## Pam guardrails (non-negotiable)

1. **Trusted truth never auto-edited.** Do not mint or extend write credentials into the Trusted base for upkeep. The only existing Trusted writer is `BRAIN_DOC_PROMOTE_TOKEN` via the Doc promote route with an approval ID.
2. **No fallback/phantom context alarms.** Retrieval fallback uses `FALLBACK_TRUSTED_SNIPPETS` with placeholder IDs (e.g. `fallback-positioning`). Do not run hash-mismatch logic against fallback snippets. Triage on score + Suspected Context Issue first; manifest/hash is tie-breaker only when grant-backed.
3. **Missing manifest is not a primary alarm.** Manifest is optional on most non-grant-backed answers (`InteractionLogBody.manifest?`). Shortlist does not require manifest presence.

## Deferred (Pam red-team — do not build yet)

| Item | Why deferred |
|------|----------------|
| Brain Health meter (0–100) | Needs enough scored, grant-backed volume first |
| Rollups, exception-tiering, monthly audit-mirror export | No scheduler exists; keep raw interaction log only |
| Auto write/edit to Trusted Brain (any field) | Propose-only until explicit human promote |
| Brain Memories auto-curate (stale/retire) | No Memories write credential wired |

## Related docs

- Schema blueprint: `docs/initiatives/brain-key-schema.md` (Brain Interactions scoring fields)
- Wiring: `docs/initiatives/brain-key-wiring.md` (Workshop write token, base boundaries)
- Live IDs: `website/src/lib/brains/airtable-ids.ts`

## Code map

| Piece | Path |
|-------|------|
| Shortlist + fallback helpers | `website/src/lib/brains/interaction-upkeep.ts` |
| List handler (shortlist param) | `website/src/lib/brains/handlers/interaction-list.ts` |
| Score handler (auto-propose on 1–2) | `website/src/lib/brains/handlers/interaction-score.ts` |
| Propose/dismiss handler | `website/src/lib/brains/handlers/interaction-action.ts` |
| Review UI | `website/src/components/brain/InteractionReviewShell.tsx` |
