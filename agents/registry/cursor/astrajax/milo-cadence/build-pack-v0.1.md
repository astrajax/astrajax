# Milo Cadence v0.1 — Cursor Build Pack

Companion to the Hyperagent build pack at
`agents/registry/hyperagent/astrajax/milo-cadence/build-pack-v0.1.md`.

## Platform split

| Runtime | Primary user | Invoke | Media |
|---|---|---|---|
| Cursor | Matthew (creative sessions) | `@milo-cadence` | `FAL_KEY` + `scripts/fal/previz.py` |
| Hyperagent | Optional / TL preference | Hyperagent thread | HA GenerateVideo and/or fal skills |

Same character, same craft. Cursor is preferred when the goal is to stop burning HA credits
on chat while keeping fal for generation cost.

## Cursor config

- Agent: `.cursor/agents/milo-cadence.md`
- Skills: `.cursor/skills/milo-cadence/`, `character-motion-timecraft/`, `fal-first-last-frame-video/`
- Claude Code mirrors: `.claude/agents/milo-cadence.md` + matching `.claude/skills/`
- Readonly: true (no repo writes)
- Model: inherit (use Grok / Composer for craft sessions; reserve expensive models for hard calls)

## Fal path

```bash
export FAL_KEY=...   # fal.ai dashboard → Keys
python3 scripts/fal/previz.py \
  --still path/to/contact.png \
  --prompt "..." \
  --engine kling \
  --out brand/.previz/name.mp4
```

Dependencies: `python3`, `requests`; for gating also `numpy`, `Pillow`, `ffmpeg`.

## Smoke test (Cursor)

1. Open AstraJax repo.
2. `@milo-cadence` — "Build a Pam Stable reaction loop (Weight + Space) from approved spine."
3. Expect: effort table, keyframes, loop logic, no palette/spine invention, "your call."
4. Optional: with `FAL_KEY` and a contact still, run `scripts/fal/previz.py` and expect a
   labeled rough previz under `brand/.previz/`.

## Source export

Ported from Hyperagent export `agent-milo-cadence` (2026-08-08) plus house fal skills
already attached on that agent (`fal-first-last-frame-video`, related scripts).
