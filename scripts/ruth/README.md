# Ruth Hadley pens (Cursor)

Convenience copies of the skill scripts under `.cursor/skills/ruth-*-*/scripts/`.

## Control plane (append-only)

```bash
export RUTH_CONTROL_PLANE_WRITE=...   # PAT create-only to appubDI76O0t8xisg
python3 scripts/ruth/control_plane_writer.py --payload /tmp/cpw.json
```

## Build pen

```bash
export AIRTABLE_BUILD_TARGET_WRITE=...
python3 scripts/ruth/build_pen_decl.py \
  --manifest signed-manifest.json \
  --approval approval.json \
  --out run-artifact.json
# offline acceptance:
python3 scripts/ruth/build_pen_decl.py --fixture-drive ...
```

Chapter 1 incubation-mode job (Text Characters live; Scope `read:brain-truth:incubation` live via Matthew UI 23 Aug 2026; remaining Category options still partial — see `docs/initiatives/brain-key-schema.md`):

```bash
export AIRTABLE_BUILD_TARGET_WRITE=...   # schema.bases:write on app6tjzzG0L0lOeVb only
python3 scripts/ruth/build_pen_decl.py \
  --manifest scripts/ruth/jobs/incubation-mode-chapter1-truth.json \
  --approval scripts/ruth/jobs/approval-incubation-mode-chapter1-truth.json \
  --out /tmp/incubation-mode-chapter1-truth-run.json
```

## Maintenance pen

```bash
python3 scripts/ruth/maintenance_execution_pen.py \
  --job job.json --out report.json
# offline:
python3 scripts/ruth/maintenance_execution_pen.py --job job.json --fixture-drive
```

Never print tokens. Ruth herself never runs mutation pens — only her executors.
