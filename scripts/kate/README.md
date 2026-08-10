# Kate scene-craft scripts (convenience)

Mirrors of Hyperagent-exported scripts. Canonical copies live under:

- `.cursor/skills/<slug>/scripts/`
- `.claude/skills/<slug>/scripts/`

Prefer those paths in agent instructions. Update all mirrors together on re-import.

| File here | Skill |
|---|---|
| `recompose.py` | `responsive-scene-recomposition` |
| `run_test_responsive_scene_recomposition.py` | `responsive-scene-recomposition` |
| `scene_layer_cut.py` | `scene-layer-cut` |
| `run_test_scene_layer_cut.py` | `scene-layer-cut` |
| `refresh_map.py` | `astrajax-website-map` |
| `pr_evidence.py`, `hotspot_editor.html`, `test_editor_core.mjs` | `scene-dev-tools` |
| `run_test_scene_dev_tools.py` | `scene-dev-tools` |

Optional env: `GITHUB_TOKEN` for `refresh_map.py` only.
