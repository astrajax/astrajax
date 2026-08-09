---
name: ruth-build-execution-pen
description: >-
  Applies one exact signed Ruth build manifest as a single Amber Airtable job. Hash + approval gates; no judgement.
---

# Ruth Build Execution Pen (v2.1.0)


## Cursor runtime

Hyperagent `RunWithCredentials` is optional here. In Cursor:

1. Put required tokens in the environment the agent shell inherits (never print them).
2. Run skill scripts via `python3 .cursor/skills/<skill>/scripts/<file.py> ...` (mirrors under `.claude/skills/` and often `scripts/ruth/` for convenience).
3. Prefer Airtable MCP for discovery reads when available; pens remain the only mutation path for signed builds / Cleared-V2 maintenance.
4. If a credential or control-plane base is missing, refuse mutation and report the gap — do not improvise.

Permanent, reusable construction pen for signed Ruth Hadley client builds. Applies ONE exact declarative signed build manifest against its declared target as a single Amber job: validate everything structurally, execute the compiled plan without per-step approval, emit an immutable hashed run artifact.

v2.1.0 replaces v2.0.0 (the "Challenger-cleared" build that proved integration-incomplete against the real signed successor, 6 Aug 2026). The executor aborted pre-mutation on it — see "What v2.0.0 got wrong" below.

## Credential posture (v2.1, per commission)

- The ONLY credential is the per-engagement `AIRTABLE_BUILD_TARGET_WRITE`, delivered by the skill credential layer. Never a CLI value, never printed, never logged.
- The pen carries NO base ID and makes NO control-plane writes. The v1.0.0 control-plane writer path and the v2.0.0 hardcoded frozen-base string are removed. Household Activity / Registry Change Log entries are the dispatcher/executor's responsibility, not the pen's.
- Target-scope proof: the platform/PAT cannot expose grant metadata, so the pen proves scope by a safe read of the manifest target and locks EVERY request URL to `target.baseId`. There is no host/base parameter anywhere in the script.

## External approval (the only authority)

The signed manifest keeps its internal draft/pending gate labels (`PENDING_DELTA_PASS`, `PENDING_FRESH_MATTHEW_OR_CLIENT_SIGNATURE`, `NOT_AUTHORISED`) because Matthew signs the file as-is; mutating it post-signature would change the hash. Those labels are historical file state, NOT authority.

Authority is a SEPARATE approval JSON the pen validates before anything else. Required keys:

- `decisionId` — must equal the manifest's `proposalDecisionId`.
- `approver` — `Matthew` (or `Matthew Hopkinson`).
- `decision` — `Approved` or `Signed`.
- `quote` — Matthew's verbatim signature words (≥12 chars). NOTE: the pen can only length-check the quote; it cannot verify the words are authentically Matthew's. The executor MUST source the quote verbatim from the signing thread before any live run.
- `date` — ISO-8601 with time.
- `manifestCanonicalHash` — must equal the recipe-computed canonical hash.
- `manifestRawSha256` — must equal the SHA-256 of the exact manifest file bytes.

A signed manifest without a matching approval file aborts at the approval gate. An approval whose hashes do not bind the exact file aborts.

## Hash gate (recipe allowlist)

`gates.proposalHash` must carry `<recipe>:<hex>`. The recipe name must be on the allowlist; an unknown recipe aborts. Recipes strip ONLY the self-referential signature material, then canonicalise (JSON, keys sorted recursively, compact separators, UTF-8, `ensure_ascii=False`) and SHA-256.

- `sha256-canonical-excluding-gates.proposalHash` — removes only `gates.proposalHash`. **Proven 2026-08-06 against the real signed successor v1.1**: canonical `0e1806d9346f3ab246f6119ce545a9fad9a1b9e078e244dbe3b585fd8fe77381`, raw `f05362fdff2ea320a5536bcedbcba40d23fab7840c3617569117149ad9be8df0`.
- `json-canonical-sha256-minus-gates` — removes the whole `gates` block (v2.0.0-era allowance for manifests that declare it by name).

## Gate order (all before the first mutation)

1. `structure` (top-level keys) → 2. `hash` → 3. `approval` → 4. `gates-inert` (in-file labels may not carry authority) → 5. `target` → 6. `credential` (safe read of the manifest base; locks all URLs to it) → 7. `structure` (compile) → 8. `beforeState` (strict live read).

## Declarative compiler (Ruth v1.x shape)

Deterministic — zero model judgement. Compiles these sections into a typed plan; any unknown manifest key, plan op, field type or section aborts:

- `reconcileExistingTables` — preserve-only (never delete/rename/recreate); verifies `exactExistingFields` by fieldId and `recordCountMustEqual`; `allowedDelta` may add formula fields only.
- `tableCreates` — ordinary non-link, non-formula fields only (link fields belong in `postCreateLinks`; formula fields belong in `postCreateComputedFields`).
- `postCreateComputedFields` — `formula` fields, post-create via `create_field`, with an immediate readback (created field must read back as type `formula` with the exact formula). `CREATED_TIME()` supported. A request for a native `createdTime` field aborts (kill criterion).
- `postCreateLinks` — `multipleRecordLinks`, resolved to real IDs after tables exist.
- `existingFieldExtensions` — `addSingleSelectChoice` (add-only; existing choices preserved verbatim with id/name/color) or a new field (must not pin a `fieldId`).
- `beforeState` — strict: `requiredTables` (by tableId; fieldId/type/name/required choices + choice IDs; recordCount), `requiredAbsentTables/Fields/SelectChoices`. `abortOnMismatch` honoured.
- `scope` — fence: `createAutomations`/`createInterfaces`/`seedRecords` must be empty; `mutateExistingRecords`/`externalWrites` must be false. Declared scope must match declared sections.

## Idempotency / retry

A same-name table or field that already exists in EXACTLY the signed shape is treated as a prior run's output (skip with evidence), not a collision. Post-create additions already applied exactly (formula field with the exact formula, a choice already present, a link already pointing at the right table) are skips. Anything present in a DIFFERENT shape is drift and aborts — never approximate, never repair silently.

## Kill criteria (abort; recorded in the run artifact)

Any write outside `target.baseId` or outside the exact declared schema ops; any existing-record mutation; any delete/rename/recreate of a reconciled table; any create where a same-name object exists in a different shape; any before-state mismatch; any native `createdTime` request; any formula field inside a table create; any automation/interface/button/script/external-account/schedule/permission/delete/migration/client-send; any unsupported approximation; any unresolved drift; any in-file gate label that reads as an authorisation.

## Usage

Exact command line the permanent Build Executor runs:

```
python3 build_pen_decl.py \
  --manifest <signed-manifest.json> \
  --approval <approval-<decisionId>.json> \
  --out run-artifact.json
```

`--fixture-drive` runs offline against `fixture_decl.py` (acceptance fixtures only; no token, no network). Live runs need `AIRTABLE_BUILD_TARGET_WRITE` in the environment (skill credential).

## Executor conditions (from the Challenger PROCEED, 6 Aug 2026)

1. Live run uses only per-engagement `AIRTABLE_BUILD_TARGET_WRITE` scoped to the signed `target.baseId`, via the skill credential layer; no CLI value, no control-plane credential in env.
2. Confirm `target.baseId` is the intended engagement base before invocation.
3. Replace the fixture approval `quote` with Matthew's verbatim signature words from the signing thread and the exact ISO date; keep the two hashes exactly as the signed file.
4. Recommended: after a green run, independently re-read the link targets, choice merges and `CREATED_TIME()` formulas (the pen's final readback records name/id/type, and re-asserts the formula at create-time, but does not re-assert link target / choice content in the final pass).
5. The pen emits only the local hashed run artifact; Household Activity + Registry Change Log entries are the dispatcher/executor's job.

## What v2.0.0 got wrong

1. Recipe name: the allowlist held `json-canonical-sha256-minus-gates[-approval]`, not the manifest's own declared `sha256-canonical-excluding-gates.proposalHash` — unknown-recipe abort on the real file.
2. Shape: v2.0.0 consumed imperative `gates.proposalHashRecipe` + `caps` + `actions[]`; the real successor is declarative — it has no `caps`/`actions` and would abort at the hash gate before ever reaching them.
3. Credential: the skill still exposed the retired `RUTH_CONTROL_PLANE_WRITE` and carried the frozen-base string; v2.1 is per-engagement `AIRTABLE_BUILD_TARGET_WRITE` only, no control-plane path, no baked base IDs.
4. Authority: v2.0.0 read in-file gate labels as authority; the real manifest correctly keeps `PENDING_*` labels because it is signed as-is. v2.1 requires an external approval JSON bound to the exact hashes instead.