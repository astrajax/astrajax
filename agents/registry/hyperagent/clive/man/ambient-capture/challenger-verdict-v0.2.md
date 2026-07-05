# Challenger Verdict — ACC Minion Build Pack v0.2 (delta pass)

**Decision type:** Delta-pass review of verdict-disposition ledger (12 items), v0.1 → v0.2.
**Challenger:** Doc's Workshop Challenger (On-Platform), thread `cmr88vdhf24em06adr91kyila`, 5 Jul 2026.
**Pack under review:** `build-pack-v0.2.md` (target `agents/registry/hyperagent/clive/man/ambient-capture/`), received as file artifact from Doc Albright (On-Platform), thread `cmr7vdgwt3b7a07ad1yyv50av`. Baseline: `build-pack-v0.1.md` (my PROCEED-WITH-FIXES, thread `cmr879kub27g807adwi0juhss`).
**Artifact transport:** compliant — both versions received as file artifacts with target repo paths stated in-file. (Pack not yet in repo by design; Executor lands it at build per §11.)
**Independence:** fresh thread; no co-drafting; scope held to the twelve ledger rows + silent-drift diff. Roster evidence: not in scope (single-minion pack, no roster claims). Rubric weights: NOT RE-CHECKED this pass (restated consistently in §1; live-verified at v0.1).

## Verdict: PROCEED — fixes folded at build, no v0.3 re-review required

All twelve ledger rows deliver what they claim. The two load-bearing fixes (F2, F3)
are honest and structurally sound. Six refinements (D1–D5, H1) are one-line or
build-step additions that do not change the design's shape; under the Autonomy &
Gating Policy they are folded into the existing batched approval and the build,
not spun into another review loop. Matthew's single approval (§8.1–8.6) remains
the sole gate. Two Red acts ride on it exactly as tiered: the credential grant
(already Matthew-approved 4 Jul) and the §8.6 schema addition.

## Per-ledger-row findings

| Row | Finding | Status |
|---|---|---|
| F2 | Single-table boundary honestly stated as prompt-level inside a base-scoped, read+create credential; kill (d) + per-tick digest table-check + table-trust assumption recorded. The no-update credential is a real blast-radius cut: worst in-base failure is a spurious *created* row, never modification/deletion of existing rows. Sufficient for Phase A. | **VERIFIED — delivered** (refinements D1, D4) |
| F3 | Criterion (a) redefined over reviewed rows, ≥10 denominator, "not evaluable — say so, don't guess." Strictly better than v0.1. Measurable from the read surface **only after** §8.6 lands AND a window mechanic exists (D2). Structural anti-gaming: minion cannot set Rejected/Promoted (prompt) and cannot update at all (credential) — double-locked, pending D4's test. | **VERIFIED — delivered in design** (gaps D2, D3) |
| F4 | Step-0 reach enumeration every tick + §6a actual-token write test at build + ACC-BND-001/004. Enumeration-per-tick paired with write-probe-at-build covers the list-vs-write scoping mismatch. Strictly stronger than v0.1's single negative read. | **VERIFIED — delivered** |
| F5 | Read exclusions: own schedule thread, own digests, digest-only threads (no human or substantive agent turns). Closes the digest-echo loop. | **VERIFIED — delivered** |
| F6 | Screen applies to claim AND verbatim quote; paraphrase workaround explicitly banned; no-quote-no-row → withhold. Exactly the fix. | **VERIFIED — delivered** |
| F7 | Per-row per-criterion scores + below-bar failing scores in every digest; ACC-CAP-004. Gate now auditable. | **VERIFIED — delivered** |
| F8 | Rider 3 disposition stated: confirmations §8.1 + §8.5, Matthew decides at approval. | **VERIFIED — delivered** |
| F9 | executionMode auto (correct under the policy — confirm-mode is the fatigue pattern); BUDGET-STOPPED partial digest; atomic rows. | **VERIFIED — delivered** |
| P1 | §6a adversarial test with the minion's actual token, Executor at build, results verbatim in Change Log; out-of-base success = STOP. Design verified; execution is a build-time act. | **VERIFIED — delivered (design; executes at build)** |
| P2 | §6b: credential grant logged as RED decision ("Matthew approved, 4 Jul") at build, not folded into Green bookkeeping. §1 records Pam's mislabel correction. | **VERIFIED — delivered (design; executes at build)** |
| P3 | Amendment **live-verified**: I read `rec88YC6cfoxYJA9a` (Draft Brain Truth) directly. Four-line Green self-tiering checklist + mis-tiering tripwire present, before promotion, as conditioned. One hole flagged (H1). Note: the pack names but never quotes the checklist — cured here (below) for registry self-containment. | **VERIFIED LIVE** (hole H1) |
| P4 | **Live-verified**: Approval Decision `apd-fleet-policy-v03-2026-07-05` exists (`recCGwU7w5AiB4ejh`), Approver = Matthew, Decision = Approved, verbatim in-thread quotes, item (2) explicitly approves the policy promotion. Not anticipatory, no self-certification. Ledger wording "Matthew's click pending" is stale — approval is GIVEN; what pends is mechanical promotion execution. | **VERIFIED LIVE** (wording nit) |

## Delta findings (fold at build; none block)

- **D1 (§6a probe target + cleanup).** The in-base adversarial create implicitly targets Approval Decisions — the one sibling table with a downstream consumer (Cursor lane, contract-bound to Approval Decision IDs). If granularity is unenforced the probe *succeeds*, leaving a spurious row in the approvals queue, and §6a requires no cleanup. Fix: probe a low-stakes table (Source Documents) instead, and require flag-for-deletion of any row a probe creates. Additionally, extend the §5 table-trust note to state whether the Cursor-lane contract verifies decision *provenance* (Approver field) or mere ID existence — create-only access + fabricated Approval Decision row + fabricated Doc Actions row is the strongest residual in-base abuse path.
- **D2 (criterion (a) window mechanic — schema-verified gap).** Draft Brain Truth carries no Reviewed At / last-modified field (checked live), so "rolling 14 days" is not computable from the read surface. Fix, either: add a `Reviewed At` dateTime to the §8.6 schema act (house precedent: Brain Interactions has exactly this field), or specify the counter as tick-over-tick status-delta tracking in the continuing thread's digest counters. One sentence.
- **D3 (review convention).** Counter (a), durable rejection memory, and dedupe 3(a) all require humans to **mark Rejected, never delete**. Nowhere stated. Fix: one line in §8.6's confirmation.
- **D4 (update-restriction untested).** §5 asserts allowedTools read+create as credential-level, but §6a never tests *update* — and no-update is what structurally stops the minion flipping its own rows to Promoted to game counter (a). Fix: §6a adds one update attempt against the tick-1 test row (expected FAIL; success = record that the no-update lock is prompt-level). The open enumeration-thread question on per-action granularity (Clive's Man family C1) is uncited — cite its result if resolved; otherwise §6a is its empirical resolution for this credential.
- **D5 (the one silent drift).** v0.1 §7's **two-week verdict review checkpoint** ("Matthew reads acceptance rate + dedupe errors and decides: lives, dies, or the fleet-wide intake skill follows") is absent from v0.2 with no ledger row. It is load-adjacent: counter (a) needs ≥10 reviewed rows, and the checkpoint is what makes review happen. Restore it (one line). All other v0.1→v0.2 deltas trace to the ledger or are faithful carriage; several are unlogged *tightenings* (never-set list extended to Rejected/Promoted; rejection memory made table-durable; read-surface restriction added) — noted, welcome.
- **H1 (P3 checklist hole — the asked-for check).** The four questions, verbatim from the live record: *"(1) does this mint or extend any credential or scope? (2) does it touch anything outside draft/Workshop surfaces? (3) is it the first run of a novel mechanism? (4) is it externally visible beyond the fleet?"* The hole: none encodes the **reversible** half of Green's own definition for destructive acts *inside* draft/Workshop surfaces. Bulk delete/overwrite of draft rows passes all four yet destroys rejection memory, audit substrate, and counter (a)'s denominator. Mitigants exist (lane contracts unloosened; this minion is create-only), but checklists become the operative test in practice. Fix: extend Q2 with "…or destroy/overwrite existing records within them?" — one clause. Since promotion is already approved, this is Matthew's call: fold the clause before the mechanical promotion executes, or promote as-is and carry H1 to the next policy revision. (Manual load justified: one extra word in an existing batched click, closing a hole before it bakes into Trusted canon.)

## Source records checked (live, this pass)

- `rec88YC6cfoxYJA9a` — Draft Brain Truth, policy draft: checklist + tripwire text confirmed present; Status = Draft.
- `recCGwU7w5AiB4ejh` / `apd-fleet-policy-v03-2026-07-05` — Approval Decisions: Matthew, Approved, verbatim quotes.
- `appL2fdnGmhA02WXd` full table schema — Draft Brain Truth field inventory (no review-timestamp field; Status options pre-§8.6 consistent with F3's premise); Approval Decisions and Doc Actions shapes consistent with the table-trust note.
- Governed defaults line (§5): unchanged v0.1→v0.2 — autoSave* off, suggestion flags off, skillScope=selected, skillLoadMode=preload, allowedIntegrations=[airtable]. **Standing family condition carried:** at build, the Executor validates the actual export JSON (validate_hyperagent_export.py) and records the autoSave flags false — this verdict does not pre-clear unverified export flags.

## Risk tiers

- **Proposer:** Medium; steady-state Green; two Red acts riding Matthew's approval.
- **Challenger:** **Medium — concur, no escalation.** The v0.2 deltas are additive controls, not scope expansion; Pam's delta-pass ruling (grant = Red) is correctly absorbed.

## Confidence by decision type

- Ledger-row text verification: **high** (all twelve against full v0.2 text; P3/P4 live against Airtable).
- Build-mechanic sufficiency (§6a, §8.6): **medium-high** — sound by design; platform granularity is empirically open until build, and the pack handles both outcomes.
- H1 hole analysis: **medium** — one real hole named against the policy's own definitions; compact checklists are allowed to lean on the surrounding text, but this clause is cheap.

## Pam recommendation

**Not warranted.** Nothing here is genuinely novel; every finding is a mechanical refinement of shapes Pam has already cleared. A further Pam pass would be the double-handling the policy prohibits.

## Final brief for Executor (on proceed)

1. Build only after Matthew's batched approval of §8.1–8.6 (§8.6 is Red — his explicit call; if he declines §8.6, criterion (a) reverts to unmeasurable: STOP and escalate, do not proceed on a silent fallback).
2. Fold D1–D4 before or during build: §6a probes Source Documents (not Approval Decisions), flags any successfully created probe row for deletion, and adds one update attempt against the tick-1 test row; §8.6 gains either a Reviewed At field or the digest-delta window mechanic, plus the mark-Rejected-never-delete convention line.
3. Restore the two-week verdict review checkpoint (D5) in the pack revision you land.
4. Record §6a results verbatim and the §6b RED grant entry in the Change Log at build; validate the export JSON and record autoSave flags false before any schedule exists.
5. resourceScope + allowedTools are Matthew's Configure-access act at save (platform fact: not settable programmatically) — verify after his act, per §6a.
6. Surface H1 to Matthew alongside the batched approval as a yes/no on one clause; do not amend the approved policy text without his word.
7. Land this verdict at the target path stated above, alongside the pack. Matthew lands nothing here himself; you land files at build per your mandate.
