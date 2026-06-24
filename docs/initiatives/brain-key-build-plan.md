# Brain Key — Composer Build Plan (QA fixes 1–9)

**Status:** Ready to hand to Composer  
**Owner:** Matthew (approves); Composer (implements)  
**Lane:** Cursor Composer — mechanical build on an approved brief. No strategy decisions.  
**Repo:** `/Users/matthewhopkinson/Documents/AstraJax/website`  
**Specs to honour:** [`brain-key-wiring.md`](./brain-key-wiring.md), [`../business/architecture.md`](../business/architecture.md)

---

## Mission

Close the nine QA findings on the Brain Key layer. Turn an in-memory demo state machine into a production-safe, Airtable-backed, audited flow — without changing the public contract of the existing API routes or weakening any governance rule.

## Hard constraints (do not violate)

1. Airtable tokens stay server-side. Never return tokens, base IDs, or grant secrets to the browser or to any model prompt. `sanitizeForClient()` stays on every response.
2. No persona (Clive/Pam/Doc) ever receives the Brain Key credential. Personas request; humans approve; server uses credentials.
3. Pam is **not** part of the Brain Key unlock flow. Do not reintroduce a Pam gate on read access.
4. A Trusted Brain credential must never be writable by a Clive/Pam chat route.
5. Keep all 15 existing tests green and the Next.js build clean. Add tests; don't delete coverage.
6. Structured Airtable writes go through deterministic REST calls (field names allowed on the REST API). Do not pull in heavy SDKs.

## Definition of done

- `npm run test:brain-key` passes with new tests for findings 1–4, 6, 9.
- `npm run build` is clean.
- With real tokens set and `BRAIN_KEY_USE_MEMORY=false`, the full flow (request → approve → retrieve → promote) persists to Airtable and survives a process restart.
- With no tokens set (`BRAIN_KEY_USE_MEMORY=true`), local dev still works exactly as today.

---

## Reference: live Airtable IDs

Already in [`website/src/lib/brains/airtable-ids.ts`](../../website/src/lib/brains/airtable-ids.ts). Field names for REST writes:

**Registry `appbdTVHevH6Bl5ZZ`**
- Brain Key Requests `tblhaWR5UNd8n01tn`: `Request ID`, `Brain Slug`, `Persona`, `Purpose`, `Scope`, `Reason`, `Session ID`, `Status`, `Requested At`, `Expires At`
- Access Grants `tblWLRYSGfLipR53P`: `Grant ID`, `Request ID`, `Brain Slug`, `Persona`, `Scope`, `Session ID`, `Approved By`, `Approved At`, `Expires At`, `Max Uses`, `Use Count`, `Status`
- Change Log `tbliAMUuKKW4DDRXF`: `Entry ID`, `Change Summary`, `Change Type`, `Changed By`, `Approved By`, `Executing Agent`, `Source`, `Reason`, `Affected Records`, `Status`, `Previous Hash`, `Entry Hash`, `Notes`

**Workshop `appL2fdnGmhA02WXd`**
- Draft Brain Context `tblswvXNYFDqnl6af`: `Title`, `Canonical Text`, `Brain Slug`, `Proposed Category`, `Status`, `Proposed By Agent`, `Created By` — **no Scope or Category**

**Trusted `app6tjzzG0L0lOeVb`**
- Brain Context `tblipHzCl905T7o5F`: `Title`, `Canonical Text`, `Category` (singleSelect), `Scope` (singleSelect), `Authority`, `Freshness`, `Last Reviewed`

---

## Phase 0 — Shared Airtable helper (prerequisite)

**New file:** `website/src/lib/brains/airtable-rest.ts`

Build a tiny server-only REST client used by every persistence task:

- `airtableSelect(baseId, tableId, token, { filterByFormula?, fields?, maxRecords? })`
- `airtableCreate(baseId, tableId, token, fields: Record<string, unknown>)`
- `airtableUpdate(baseId, tableId, token, recordId, fields)`
- `airtableFindOne(baseId, tableId, token, filterByFormula)` → first record or null

Rules: `cache: "no-store"`, throw on non-2xx with status only (no body echo, to avoid leaking tokens into errors), 10s timeout. No new dependencies.

**Acceptance:** unit test with `fetch` mocked covering create, select, and a non-2xx throw.

---

## Phase A — Persist grants + requests to Registry (Findings 1, 3)

The headline fix. Grants and requests must live in Airtable so they survive serverless instance changes, and every issuance writes a Change Log entry.

### A1. Storage abstraction
**New file:** `website/src/lib/brains/store/index.ts` exporting a `GrantStore` interface:
`createRequest`, `getRequest`, `setRequestStatus`, `createGrant`, `getGrant`, `incrementGrantUse`, `setGrantStatus`, `revokeGrantsForBrain`.

**New files:**
- `store/memory-store.ts` — move the existing `Map` logic out of `grants-store.ts` into here (behaviour identical).
- `store/airtable-store.ts` — same interface, backed by `airtable-rest.ts` against Registry tables.

**Edit:** `website/src/lib/brains/grants-store.ts` becomes a thin selector: `getStore()` returns memory or airtable store based on `useMemoryStore()`. Keep `hashContent`, `resetMemoryStoreForTests` re-exported so existing imports/tests don't break. Keep the public function names (`createKeyRequest`, `approveKeyRequest`, `getGrant`, `consumeGrantUse`, `revokeGrantsForBrain`, etc.) as wrappers delegating to `getStore()` — handlers and tests should not need rewriting.

### A2. Airtable store mapping
Map field names exactly as listed above. `Status` select values: requests use `Pending/Approved/Rejected/Expired`; grants use `Active/Revoked/Expired`. Dates as ISO strings. `Use Count` increments via read-modify-write through `airtableUpdate`.

Look-ups (`getGrant`, `getRequest`) use `filterByFormula={Grant ID}='…'` / `{Request ID}='…'`.

### A3. Change Log writer
**New file:** `website/src/lib/brains/change-log.ts` → `appendChangeLog(entry)`:
- Reads the latest entry's `Entry Hash` (sort by created time desc, maxRecords 1) as `Previous Hash`.
- Computes `Entry Hash = sha256(previousHash + canonical JSON of entry fields)` using existing `hashContent`.
- Writes the row. Never include secrets in any field.

Call `appendChangeLog` on: grant issued (`Change Type: Grant Issued`), grant revoked (`Grant Revoked`). In memory mode, no-op (or append to an in-memory array for tests).

**Acceptance:**
- New test: with `BRAIN_KEY_USE_MEMORY=false` and mocked `fetch`, approving a request issues a grant row and a Change Log row whose `Previous Hash` equals the prior `Entry Hash`.
- Existing memory-mode tests still pass unchanged.

---

## Phase B — Real Doc promote (Finding 2)

**Edit:** `website/src/lib/brains/handlers/doc-promote.ts`

In `airtable` mode (doc token present), actually:
1. For each promotion item: read the draft row from Workshop `Draft Brain Context` (**Title**, **Canonical Text** only).
2. Create a **new** row in Trusted `Brain Context` with `Category` and `Scope` from the **promote payload** (not from draft); `Freshness: Current`, `Last Reviewed: today`, `Authority: approver`.
3. Set the Workshop draft `Status` → `Quarantined` (consumed) — do not delete.
4. `appendChangeLog` with `Change Type: Context Promote`, `Approved By: approver`, `Executing Agent: Doc`, `Affected Records:` trusted record IDs, `Reason`.
5. `revokeGrantsForBrain(brainSlug)` as today.

Promote body uses `promotions: [{ draftRecordId, category, scope }]` — see `brain-key-wiring.md`.

Use the Doc promote token (`BRAIN_DOC_PROMOTE_TOKEN`) for both reads and writes here — this is the only route allowed to touch both bases. Memory mode keeps current stub behaviour.

**Acceptance:** test (mocked `fetch`) asserting a promote creates a trusted row, quarantines the draft, writes one Change Log entry, and still requires `approvalDecisionId`.

---

## Phase C — Demo correctness (Findings 4, 5)

### C1. Unify scope semantics (Finding 4)
Pick one scope model and apply everywhere. Use **exact-match scope** as the contract:
- `validateGrant` already does exact string equality — keep it.
- **Edit** `website/src/lib/brains/trusted-context.ts`: stop parsing the trailing `:` token. Match the trusted `Scope` field against the **full** grant scope string (`filterByFormula={Scope}='<scope>'`), OR treat scope as a prefix filter with an explicit, documented rule. Whichever you choose, the seeded records and the demo must use the same scope values.
- **Reseed/align:** update the two trusted seed rows' `Scope` (via the Airtable UI or a one-off script comment in the brief) so a documented demo scope returns them. Document the exact demo scope string at the top of `trusted-context.ts`.
- Add a comment block stating the canonical scope format, e.g. `read:brain-context:<area>`.

**Acceptance:** test proving a grant with the documented demo scope returns the seeded snippets (not fallback), and a non-matching scope returns fallback.

### C2. Make route guards real (Finding 5)
**Edit:** `website/src/lib/brains/guards.ts` — `assertRouteMayReadTrusted` / `assertRouteMayPromote` currently can't fail. Replace the self-call pattern: have each route pass its own identity from a single source of truth (e.g. a `ROUTE_IDS` const), and add a test that simulates a non-retrieve route attempting trusted read and expects a throw. If the guard is genuinely redundant given import boundaries, either (a) make it enforce something real (allow-list checked against the calling route constant), or (b) delete it and document that isolation is by credential + import boundary. Do not leave a guard that only pretends to guard.

**Acceptance:** test reflects whichever path is chosen; no dead guard remains.

---

## Phase D — Hardening (Findings 6, 7, 8, 9)

### D1. Rate limit `key/request` (Finding 6)
**New file:** `website/src/lib/brains/rate-limit.ts` — simple fixed-window limiter keyed by `sessionId` (and IP if available), e.g. max 5 requests / 5 min. In-memory is acceptable; document that production should swap to Upstash/Vercel KV. Apply in the `key/request` route before `handleKeyRequest`. Return 429 on exceed via `jsonError`.

**Acceptance:** test that the 6th rapid request from one session is rejected.

### D2. Remove dead branching (Finding 7)
**Edit:** `website/src/lib/brains/secrets.ts` — `sanitizeInteractionForPersistence`: drop the unused `snippets` param and the no-op `if (manifest?.grantId)` branch. Keep the secret-rejection asserts. Add a one-line comment that trusted text is never passed to the log endpoint by construction.

### D3. Dev approve auth note (Finding 8)
**Edit:** `website/src/lib/brains/http.ts` — keep prod behaviour (throws if secret missing). In non-production with no secret, log a `console.warn("Brain Key admin auth disabled — dev only")` once. Do not change prod semantics.

### D4. Runtime persona validation (Finding 9)
**Edit:** `website/src/lib/brains/types.ts` (or a small `validatePersona` in `guards.ts`) — add a runtime check that `persona ∈ {clive, pam, doc}` (and that request/log reject unknown values with a 400). Wire into `handleKeyRequest` and `handleInteractionLog`.

**Acceptance:** test that `persona: "ceo"` is rejected.

---

## Suggested order & checkpoints

1. Phase 0 helper → 2. Phase A (1,3) → 3. Phase B (2) → 4. Phase C (4,5) → 5. Phase D (6–9).

Run `npm run test:brain-key && npm run build` after each phase. Stop and escalate to Matthew if any change would alter an API response shape the UI will depend on, weaken a governance rule, or require a new dependency.

## Out of scope (do not build)

- Public Chapter 1 UI and admin workbench (separate brief).
- Real model calls / Anthropic wiring into Brain Key routes.
- HyperAgent packaging, billing, multi-tenant credentials.
- Swapping in-memory rate limit for KV (leave a TODO).

## Files Composer will touch

```
website/src/lib/brains/airtable-rest.ts        (new)
website/src/lib/brains/store/index.ts          (new)
website/src/lib/brains/store/memory-store.ts   (new)
website/src/lib/brains/store/airtable-store.ts (new)
website/src/lib/brains/change-log.ts           (new)
website/src/lib/brains/rate-limit.ts           (new)
website/src/lib/brains/grants-store.ts         (edit → selector)
website/src/lib/brains/trusted-context.ts      (edit → scope)
website/src/lib/brains/guards.ts               (edit → real guard + persona)
website/src/lib/brains/secrets.ts              (edit → dead code)
website/src/lib/brains/http.ts                 (edit → dev warn)
website/src/lib/brains/handlers/doc-promote.ts (edit → real promote)
website/src/lib/brains/handlers/key-request.ts (edit → persona validate)
website/src/lib/brains/handlers/interaction-log.ts (edit → persona validate)
website/src/app/api/brains/key/request/route.ts (edit → rate limit)
website/src/lib/brains/*.test.ts               (new/extended tests)
```
