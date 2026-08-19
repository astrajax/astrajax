# Clive's Man Hyperagent v0.4 — governed source scripts

Governed copies extracted from observed-live evidence (`agents/registry/hyperagent/clive/man/observed-live/2026-08-12/`) and patched only for cleared v0.4 contract deltas.

## Layout

| Path | Role |
|------|------|
| `specialists/context-estate-audit-propose/` | Context Auditor scheduled skill (06:00) — does not choose projects |
| Head agent (existing `clive-man`) | Project-link pass 06:30 — **leave OFF**; IDs or none only |
| `specialists/context-estate-challenge/` | Context Challenger scheduled skill (07:00) — veto only |
| `specialists/context-amendment-execute/` | Context Executor scheduled skill (08:00) — **leave OFF**; writes given IDs |
| `ambient/` | Ambient V1 intake HTTP writer |
| `on-demand/` | Lane B read helper + on-demand Executor pen |

## Credentials (names only — never values)

| Env var | Agent / skill |
|---------|----------------|
| `AMBIENT_V1_CREATE` | Ambient Capture embedded skill |
| `CLIVE_MAN_WORKSHOP_READ` | On-demand Proposer + Challenger |
| `CLIVE_MAN_ON_DEMAND_WRITE` | On-demand Executor |
| `CONTEXT_ESTATE_READ` | Context Auditor read |
| `CONTEXT_V1_CONTROL_WRITE` | Context Auditor V1 write |
| `CONTEXT_CHALLENGE_READ` | Context Challenger read |
| `CONTEXT_V2_CONTROL_WRITE` | Context Challenger V2 write |
| `CONTEXT_AMENDMENT_EXECUTE` | Scheduled Context Executor only |

## Offline tests

```bash
python3 hyperagent/builds/sources/clive-man-v0_4/specialists/context-estate-audit-propose/test_auditor.py
python3 hyperagent/builds/sources/clive-man-v0_4/specialists/context-estate-challenge/test_challenger.py
python3 hyperagent/builds/sources/clive-man-v0_4/specialists/context-amendment-execute/test_executor.py
```

Generator embeds these scripts into Hyperagent exports via `_clive_man_specialist_loader.py`.
