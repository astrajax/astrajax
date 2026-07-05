# Executor Dispatch Brief — Build: Ambient Context Capture Minion (from pack v0.2)

**Target repo path:** `agents/registry/hyperagent/clive/man/ambient-capture/executor-brief-v1.md`
**Dispatcher:** Doc Albright (On-Platform), thread `cmr7vdgwt3b7a07ad1yyv50av`, 5 Jul 2026
**One dispatch per approval — this is the single Phase B dispatch for this build.**

## Clearance (Trinity + Matthew)

- **Pack:** build-pack v0.2 (attached; target `agents/registry/hyperagent/clive/man/ambient-capture/build-pack-v0.2.md`). Supersedes v0.1 (also attached, for the audit trail).
- **Proposer/design:** Doc Albright (On-Platform), merged Workshop design lane.
- **Challenger:** v0.1 full pass — PROCEED-WITH-FIXES (thread `cmr879kub27g807adwi0juhss`; verdict artifact `challenger-verdict-acc-minion-v0.1.md` in that thread, target `agents/registry/hyperagent/clive/man/ambient-capture/challenger-verdict-v0.1.md`). All eight findings folded into v0.2 (§12 ledger). v0.2 delta verdict: reference supplied in the dispatch message accompanying this brief.
- **Pam:** three passes (thread `cmr6kk5xx1idl07adqjdsyu49`); delta-pass conditions P1–P4 folded into v0.2. Not a blocking pass; her ruling that the credential grant is Red is honoured in your step 4.
- **Matthew:** APPROVED, in-thread, 5 Jul 2026, verbatim: "ACC pack v0.2 approved, all six confirmations as designed including the Rejected/Promoted schema addition. Execute the schema change, then dispatch Phase B to the Executor once the delta verdict is clean." Recorded as **Approval Decision `apd-acc-minion-v02-2026-07-05`** (record `recJSGFRuIbFyNlnq`, Approval Decisions, base `appL2fdnGmhA02WXd`).

## Pre-completed by Doc (do not repeat)

- Schema: Draft Brain Truth Status now includes `Rejected` (`selEeYiRDpPxtkGVL`) and `Promoted` (`selr8DMkubcP1li10`) — verified; Change Log `acc-schema-rejected-promoted-2026-07-05`.
- Minions row registered: `appZ71CSKBlhnb4hR/tblqvGSnKOKReBX41/recriyVVXkxXUoWPy` (Status blank — you flip it to Active at build completion).
- Phase A Change Log closed: `acc-minion-phase-a-2026-07-05` (Complete).

## Build sequence (stop points marked)

1. **Create the agent on-platform** from pack v0.2 §3–§5: name "Clive's Man — Ambient Capture", slug `clive-man-ambient-capture`, sonnet-class modelId from the account catalog, system prompt verbatim from pack §4, tools per §5 (Airtable + thread read/search + rubric read only; everything else off; learning flags per fleet governed defaults; executionMode auto; suggested budget cap USD 1.50/run). Ask-first per your contract — Matthew's approval card is the gate working.
2. **STOP — Matthew's Configure access act:** Airtable connection scoped to base `appL2fdnGmhA02WXd` only AND allowedTools restricted to read + create. This is his UI act on the saved agent. Confirm with him in your thread that it is done before step 3.
3. **Adversarial credential verification (pack §6a, Pam P1):** with the minion's actual connection, attempt one write outside the Workshop base — it MUST fail; record the exact attempt and refusal verbatim. If table-level granularity is expressible, also attempt an in-base create against a non-Draft-Brain-Truth table and record the result either way (the design assumes the single-table boundary may be prompt-level; kill criterion (d) is its monitor). **If the out-of-base write succeeds: STOP the build, escalate to Matthew and Doc — the tier premise fails.**
4. **Change Log (Brain Registry), two entries:** (a) the credential grant logged as a RED-tier decision — "Matthew approved, 4 Jul 2026; grant minted at build 5 Jul" (Pam P2), with the §6a verification results verbatim; (b) the build itself, referencing `apd-acc-minion-v02-2026-07-05`.
5. **Create the schedule:** `FREQ=DAILY`, 06:30, Europe/London, threadStrategy `continue`, **unattended integration writes ENABLED** (per-schedule toggle), read-only OFF, alert OFF.
6. **Tick 1 runs as the demonstration tick** (pack §4): step-0 reach enumeration reported in full, thread titles enumerated, exactly one test draft row written and flagged for Matthew's deletion. You do not need to babysit it; confirm the schedule exists and the first-run time.
7. **Repo versioning (under the same Approval Decision):** land under `agents/registry/hyperagent/clive/man/ambient-capture/`: build-pack v0.1, build-pack v0.2, challenger-verdict v0.1 (from its thread), the v0.2 delta verdict, and this brief. Update roster/export artifacts per your lane (export JSON for the new minion). Hand-sync acceptable; the generator pipeline remains parked.
8. **Flip the Minions row to Active** (`recriyVVXkxXUoWPy`) with the built agent id noted in Scope.

## Report back

Agent id, schedule id, §6a verification results verbatim, Change Log entry ids, repo paths landed, Minions row flip, and anything you could not do with exact reasons. Doc's handoff summary to Matthew will follow your report; Clive's Man context sync owed (Cursor lane) after your repo writes.

## Boundaries reminder

Your contract governs: Ask-first on-platform mutations, Trinity-cleared briefs only, no canonical context writes, no deploy beyond the scoped build. Nothing in this brief overrides the pack's hard boundaries; where brief and pack conflict, the pack wins and you stop and ask.
