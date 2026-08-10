# Prof. Halvard Bjornson — Cursor full twin v0.1

Ported from Hyperagent export `agent-prof-halvard-bjornson (1).json` (2026-08-08).

## Platform split

| Runtime | Invoke | Ward rounds | Model (HA export) |
|---|---|---|---|
| Cursor | `@halvard-bjornson` | Manual only | inherit |
| Hyperagent | Hal thread | Mon 08:30 Europe/London (scheduled) | claude-fable-5 |

Same character, same craft. Cursor replaces HA roster hydration with local repo reads.

## Cursor files

**Agents**

- `.cursor/agents/halvard-bjornson.md` (reasoning head)
- `.claude/agents/halvard-bjornson.md` (mirror)

**Skills**

- `halvard-bjornson` (hub)
- `physician-rubric-craft` (duty 1)
- `physician-vitals-and-tracking` (duty 2)
- `physician-human-signals-triage` (duty 4)
- `physician-activity-reviewer` (+ `score_update.py` script)
- uses existing `household-conduct-standard`, `household-communication-standard`, `household-routing-standard`, `fleet-activity-logging`

**Scripts convenience path:** `scripts/physician/score_update.py`

## Credentials Matthew needs

| Env | Purpose | Status |
|---|---|---|
| `FLEET_ACTIVITY_WRITE` | Create-only Household Activity log rows | Shared fleet credential; script at `hyperagent/scripts/log_fleet_activity.py` (synced with HA) |
| `FLEET_ACTIVITY_REVIEW` | Reviewer pen — Agent Quality + Review Status only | **Not yet configured in Cursor** — scoring STAGED until set |
| Hal Physician base | Consultation + Rounds events in Hal's Agent base | **Airtable MCP** access to Hal's physician base when ward rounds should land live (HA used native integration; no separate env var in export) |

Create `FLEET_ACTIVITY_REVIEW` at airtable.com/create/tokens: scopes `data.records:read` +
`data.records:write`, base `appF7jQD4ZKrDC7e1` ONLY. Deliberately separate from the sealed
create-only writer token.

## Smoke tests

1. `@halvard-bjornson` — "What's the health of `@ristral` based on repo definition and any Activity exports you can see?" Expect: honest Not Graded or provisional vitals, no fabricated scores, no repo edits.
2. `@halvard-bjornson` — "Draft a rubric for `@doc` on build-scope discipline." Expect: orthogonal dimensions, adoption contract named, no live agent changes.
3. With `FLEET_ACTIVITY_REVIEW` set: dry-run `python3 scripts/physician/score_update.py --staged /tmp/score_staged.json` on a staged JSON file — expect DRY RUN report, no token printed.

## Explicitly not ported as Cursor schedules

HA weekly Ward Rounds (`FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=30`). Run manually via `@`
when Matthew wants a pass.

## Honest gaps

- Cross-agent thread reads unavailable (both runtimes).
- Eval history / rubric run history unavailable in Cursor unless exported.
- Ward Roster authoritative in Hal's Airtable base — repo agent list is fallback.
- `FLEET_ACTIVITY_REVIEW` not yet in Cursor env — reviewer duty stages to file.
- Hal Physician base writes need Airtable MCP access to Hal's agent base — Consultation/Rounds landing may be STAGED without it.
- Queue v1 Recommendations writes depend on Airtable MCP or Matthew granting write to `appL2fdnGmhA02WXd`.

## Source export

- Model: `claude-fable-5`
- Integrations: github, airtable
- Skills attached: 4 household standards + 4 physician craft skills
- HA toolSettings: exa-mode, documents, searchthreads (Cursor uses WebSearch/MCP equivalents where available)
