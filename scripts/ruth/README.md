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

## Maintenance pen

```bash
python3 scripts/ruth/maintenance_execution_pen.py \
  --job job.json --out report.json
# offline:
python3 scripts/ruth/maintenance_execution_pen.py --job job.json --fixture-drive
```

Never print tokens. Ruth herself never runs mutation pens — only her executors.
