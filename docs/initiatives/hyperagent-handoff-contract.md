# HyperAgent handoff contract

**Status:** working — Track 3 of [`build-velocity-tracks.md`](./build-velocity-tracks.md).  
**Owner:** Matthew.  
**Read with:** [`hyperagent/docs/hyperagent-deploy-playbook.md`](../../hyperagent/docs/hyperagent-deploy-playbook.md), `@doc-workshop-hyperagent`.

Two lanes. Do not collapse them.

---

## Lane A — On-platform / internal

Used when HyperAgent Doc + Workshop Executor apply a **cleared brief** inside HyperAgent under Household Conduct.

| Tier | Behaviour |
|------|-----------|
| **Green** | Bounded draft/Pending config under an already-approved brief; act; batch-review later |
| **Amber** | First run of a novel mechanism; act then notify Matthew |
| **Red** | Live config application, promotions, credential/scope grants; propose; wait for Matthew |

Builders in Cursor still **never** paste secrets or create webhooks. On-platform Executor follows HA gating; repo twin stays Draft until a job or courier lands files.

---

## Lane B — Client / manual (repo → UI import)

Used when the artifact is a **repo export JSON** Matthew imports in the HyperAgent UI (client fleets, first-time agents, or when write-back is unavailable).

**Existing household skill refresh:** do not default to UI import, and do not send the JSON to Doc. Cursor MCP → **Skill Forge** with the skill JSON attached (overwrite in place; keep the live agent and its kite). Agent JSON import stays Lane B (new agent, rebuild, or recovery).

**Phase B is incomplete** until:

1. Generator ran (no hand-edited export JSON).
2. `python3 hyperagent/scripts/validate_hyperagent_export.py <export.json>` passed.
3. `python3 hyperagent/scripts/handoff_hyperagent_export.py <export.json>` printed the handoff card.
4. Summary includes the handoff card + playbook pointers.

### Handoff card fields

- Export path (absolute or repo-relative)
- Import type: **agent-only** (embedded skills) vs **separate skill JSON**
- Credentials owed (yes/no — never values)
- Webhook needed (yes/no)
- **Do not delete the HyperAgent agent** unless retiring it
- Smoke / next Matthew step

---

## Script

```bash
python3 hyperagent/scripts/handoff_hyperagent_export.py hyperagent/exports/agents/agent-….json
```

Runs validation, then prints the ordered checklist + card.
