# Kate — Cursor scene-craft skills twin v0.1

Ported from Hyperagent skill exports (2026-08-08 Downloads). Cursor is Kate's
in-IDE build lane; Hyperagent remains the reasoning-head runtime for visual
judgement and commissions. Same craft, same pipeline — different tools.

## Platform split

| Runtime | Invoke | Scene-craft skills | Deploy checks |
|---|---|---|---|
| Hyperagent | Kate thread | HA skill objects (incl. optional Vercel API) | HA Vercel API skill |
| Cursor | `@kate` | Twin skills under `.cursor/skills/` (+ `.claude/` mirrors) | **Vercel MCP** / `vercel` CLI / plugin skills — **not** a ported Vercel API skill |

## Explicit skip

**Hyperagent `Vercel API` skill is not ported.** Matthew: Cursor already has
Vercel MCP. Phase 6 deploy / preview checks use:

- Vercel MCP tools (plugin)
- `vercel` CLI
- Cursor Vercel plugin skills (`deployments-cicd`, `vercel-cli`, etc.)

Do not re-introduce a standalone Vercel API skill into the Cursor twin.

## Cursor files

**Agents**

- `.cursor/agents/kate.md`
- `.claude/agents/kate.md` (mirror)

**Skills (this batch)**

| Slug | Export used | Scripts |
|---|---|---|
| `scene-craft-waterfall` | `skill-scene-craft-waterfall.json` | none (index) |
| `astrajax-website-map` | `skill-astrajax-website-map (1).json` | `refresh_map.py` |
| `scene-dev-tools` | `skill-scene-dev-tools (1).json` | `pr_evidence.py`, `hotspot_editor.html`, `test_editor_core.mjs`, `run_test.py` |
| `scene-layer-cut` | `skill-scene-layer-cut (1).json` | `scene_layer_cut.py`, `run_test.py` |
| `responsive-scene-recomposition` | `skill-responsive-scene-recomposition (2).json` (prefer over `(1)`) | `recompose.py`, `run_test.py` |

**Convenience scripts:** `scripts/kate/` (colliding `run_test.py` names disambiguated)

**Registry:** this file

## Script hashes (export = Cursor = Claude)

| Skill / file | sha256 |
|---|---|
| `responsive-scene-recomposition` / `recompose.py` | `5410d83b5bd025bee247917069b24a6a3ff02ae711d192960ca906a40fed5a6b` |
| `responsive-scene-recomposition` / `run_test.py` | `8ddac1b7a571093fe004323883b8ef09a3476f82ae224f9569a0b9a7d02faa3f` |
| `scene-layer-cut` / `scene_layer_cut.py` | `e7bed40630420a539d4bc00f51efb1530cfcac8071d6a26c96ef0dab4014f563` |
| `scene-layer-cut` / `run_test.py` | `0c46ebdce9de85171d7907d750b02a18439462a84a144a28d4b086e5328b8333` |
| `astrajax-website-map` / `refresh_map.py` | `85f478813774bf38d3c4beb00efe5cda150902960151178a3f3af316c49a7aa3` |
| `scene-dev-tools` / `pr_evidence.py` | `187ea31441e5244bf7b2290dbc6556bd8b697836507c1855d6c6d14377aefbc7` |
| `scene-dev-tools` / `hotspot_editor.html` | `7abf60c76c23725b268c062c42e0e3f59c9fa6d92e9f28dbb2fd2e3b8e7955e0` |
| `scene-dev-tools` / `test_editor_core.mjs` | `16bebbb670be7d7799b9d9bc79b7bd1641b1f796526587121bca58f7e0219cc0` |
| `scene-dev-tools` / `run_test.py` | `6ceda441e5d740c4c1a34b93573aed59e20569d6d02e0ae72cf3f6f3b3c954c0` |

No prior repo copies of these scripts existed; all are fresh from export (no
hash-conflict updates needed).

## Credentials (env)

| Env | Skill | Required? | Purpose |
|---|---|---|---|
| `GITHUB_TOKEN` | `astrajax-website-map` | Optional | Fine-grained PAT (Contents: Read) for `refresh_map.py` one-call tree fetch only |

All other skills in this batch: `authType: none`. Prefer local git / filesystem
over GitHub API when already in the AstraJax workspace.

## HA → Cursor tool map (summary)

| Hyperagent | Cursor |
|---|---|
| `github__*` | Local `git` / `gh` / **Read** on `website/` |
| `GenerateImage` | **GenerateImage** (`reference_image_paths` for masters) |
| `execute-script` / skill scripts | `python3 .cursor/skills/<slug>/scripts/…` |
| `RunWithCredentials` | Env vars in the agent shell (only `GITHUB_TOKEN` here) |
| Browser / Playwright | Local Playwright or manual frames → `pr_evidence.py compose` |
| Vercel API skill | **Vercel MCP / CLI / plugin** — not ported |

## Wired into `@kate`

Both `.cursor/agents/kate.md` and `.claude/agents/kate.md` list:

1. `scene-craft-waterfall` (index first)
2. `astrajax-website-map`
3. `scene-dev-tools`
4. `scene-layer-cut`
5. `responsive-scene-recomposition`

plus existing house craft standards (`vercel-react-best-practices`,
`emil-design-eng`, `frontend-design`, `web-design-guidelines`), the Vercel MCP
note, and the fleet-activity / Clive's Man handoff already on the agent.

## Not re-ported (explicit)

- Household standards / `fleet-activity-logging` (already on Kate; out of batch)
- Hyperagent `Vercel API` skill

## Honest gaps remaining

- Phase 1 / 4 media specialists named by the waterfall but not in this batch:
  creative-prompting, advanced-image-techniques, video-motion, video-prompting,
  Veo Seamless Video Loop Production, alpha-accent-forge, video-continuation-patterns,
  hyperframes, voice-direction.
- Already available in-repo for some motion work: `fal-first-last-frame-video`,
  `character-motion-timecraft` (Milo lane) — use when they apply; do not invent
  missing HA specialists.
- `astrajax-website-map` body stamp is 4 Aug 2026 @ `fa80cbd…` — re-verify against
  current `website/` git before trusting; refresh as needed.
- Playwright must be installed locally for `pr_evidence.py capture`.
- Pillow / numpy required for cut / recompose / compose tools.

## Smoke tests

1. `@kate` — "Where do Chapter 1 scene manifests live?" Expect: load
   `astrajax-website-map` / waterfall Phase 0; cite repo paths; no directory crawl.
2. Offline: `python3 .cursor/skills/responsive-scene-recomposition/scripts/run_test.py`
3. Offline: `python3 .cursor/skills/scene-layer-cut/scripts/run_test.py`
4. Offline: `python3 .cursor/skills/scene-dev-tools/scripts/run_test.py`
5. Deploy check phrasing: Kate names Vercel MCP / CLI, never a Vercel API skill.
