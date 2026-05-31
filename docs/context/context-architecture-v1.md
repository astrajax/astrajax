# Context Architecture V1 Context Pack

**Status:** Bootstrap draft.  
**Primary destination:** Cursor/GitHub.  
**Owner:** Matthew.  
**Primary sources:** `clive_context_architecture_v1.md`,
`hyperagent/context_architecture_schema_v1.json`.

## Purpose

Summarise the V1 schema, status lifecycle, write permissions, and publishing
rules for agents that need to understand Clive's context operating layer.

## Tables

- `Context Intake`: messy submissions and review candidates.
- `Context Items`: durable proposed and approved context records.
- `Context Packs`: bundles of approved context for workflows, agents, and
  destinations.
- `Agent Environments`: agent registry and context needs.
- `Change Log`: append-only audit of approved/published changes.

## Write Surfaces

- Clive Intake writes only `Context Intake`.
- Clive Curator writes only `Context Items` with `Status = Proposed`.
- Clive Publisher, when built, appends `Change Log` entries and prepares
  approved exports.
- Matthew owns approval.

## V1 Table IDs

- Base: `appYv601Oq7fKTCj0`
- Context Intake: `tblJCmPGPUyszgFux`
- Context Items: `tblisiZJQmQuBqEef`
- Context Packs: `tblcMubmJXW92D18r`
- Agent Environments: `tblYuSo413ZeQuoq3`
- Change Log: `tbl9jCEYH1mM8b7T2`

## Lifecycle

```text
New / Ready for review -> Proposed -> Needs decision -> Approved -> Published -> Deprecated
```

Supporting statuses:

- `Draft`
- `Rejected`
- `Prepared`
- `Deployed`
- `Rolled back`
- `Cancelled`

## Source IDs

- `SRC-CLIVE-ARCH-V1`: `clive_context_architecture_v1.md`
- `SRC-CLIVE-SCHEMA-V1`: `hyperagent/context_architecture_schema_v1.json`
