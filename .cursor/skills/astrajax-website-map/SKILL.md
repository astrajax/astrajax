---
name: astrajax-website-map
description: >-
  Fast navigation of the astrajax/astrajax website codebase without directory-crawling: an annotated map of routes, components, lib modules, and asset conventions, plus a one-call refresh script (git/trees recursive) and the session-start orientation ritual. When to use: Load at the start of any session touching astrajax/astrajax website code. Refresh when newer website commits or open PRs make the stamp stale. Not for the wider repo outside website/.
---

# astrajax-website-map

Verified 4 Aug 2026 against repository main @ `fa80cbdbd970b763b11f452fc1f73b257574376c` (merge of PR #68). No open pull requests at the verification point. PRs #64–#68 are landed: operator state/auth and `/enter`, fitted `/house` and `/showroom` routes, Receiving Wall fixes, IA art-commission context, final Brain Vault loops, Court media, and Clive hero/gesture assets.

The map decays. At every website session start, check commits and open PRs before trusting it.


## Cursor runtime

Ported from Hyperagent export `skill-astrajax-website-map (1).json` (2026-08-08;
prefer over older unnumbered export — larger/newer map body). Hyperagent
mechanics map to Cursor as follows:

| Hyperagent | Cursor |
|---|---|
| `github__list_commits` | Local `git log` / `gh api` — prefer **local git** in this workspace |
| `github__list_pull_requests` | `gh pr list` / `gh pr view` |
| `github__get_file_contents` | **Read** tool on local paths under `website/` (source of truth in-repo) |
| Directory crawl avoidance | Same: use this map + targeted Read/Grep; do not walk the tree blindly |
| `RunWithCredentials` + `refresh_map.py` | Optional env `GITHUB_TOKEN` (fine-grained PAT, Contents: Read) for the one-call tree fetch only |

**When already in the AstraJax workspace:** prefer local filesystem + git over
GitHub MCP/API. The map still decays — re-check `git log --oneline -20 -- website`
and open PRs at session start before trusting the stamp in the body below.

**Refresh script (optional remote tree fetch):**

```bash
# env (optional): GITHUB_TOKEN
python3 .cursor/skills/astrajax-website-map/scripts/refresh_map.py
# mirrors: .claude/skills/astrajax-website-map/scripts/
# convenience: scripts/kate/refresh_map.py
```

Without `GITHUB_TOKEN`, skip remote refresh and update the map from local git /
file reads instead. Never print the token.

## Session-start ritual

1. Load this skill for orientation.
2. Run `github__list_commits` on main (general and `path: website`) and compare with the stamp above.
3. Run `github__list_pull_requests` for overlapping work.
4. Fetch exact files with `github__get_file_contents`; use search only for symbol hunting and confirm by imports.
5. If newer website work changes the map, run the refresh script and replace this documentation in full.

## Stack

Next.js App Router, React 19, TypeScript, Tailwind/PostCSS and shadcn on Vercel. Auth.js v5 now supplies operator sessions. Tests: Vitest and Playwright. Key files: `website/package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, `playwright.config.ts`, `vitest.config.ts`.

## Routes — `website/src/app/`

Public/journey surfaces:

- `/`
- `chapter-1`
- `enter`, `enter/recover`, `enter/sign-in`
- `journey` (repo-kept; public route disabled)
- `seeds-of-promise`

House and human-facing back-of-house:

- `house` — canonical House hub; currently the Phase 1 fitted-room placeholder. Its source comment says Phase 3 replaces it with Kate’s room-registry collage.
- `showroom` — fitted-state placeholder.
- `man/receiving-wall` — Receiving Wall portal.

Platform/internal:

- `adoption`
- `agents`, `agents/[slug]`
- `aie-demo` (redirects to `/chapter-1`; approve/promote handlers remain)
- `brain`, `brain/[slug]`, `brain/[slug]/curate`, `brain/health`, `brain/intake`, `brain/review`
- `coach`
- `command`, `command/clive`, `command/doc`, `command/doc/build`, `command/pam`
- `court`
- `deploy`, `dispatch`, `fleet`

## API — `website/src/app/api/`

Serving surfaces:

- `ask-clive/route.ts` — public governed streaming Q&A, Clive/Pam, spoken register.
- `clive-voice/route.ts` — OpenAI TTS proxy.
- `auth/[...nextauth]` and `auth/request-code` — Auth.js session and one-time-code entry.
- `journey/progress` — server-authored chapter/step progress and resume URL.
- `chapter1/intake-chat` — AI interview with scripted fallback.
- `chapter1/classify-user-brain` — authoritative transcript re-read.
- `brains/curation/{chat,confirm,docket}` — multi-round curation.
- `brains/receiving-wall/{route,accept,clive}` — Receiving Wall data and action surfaces.
- `court/{deliberate,bicker}` — Court engines; deliberate fans out across the bench.
- Brain API also includes demo seed, Doc promote, health, interactions action/list/log/score, key approve/request, paper trail, source-document mine and truth retrieve.

Platform telemetry:

- `platform-sessions/{start,pause,reopen,close,sweep}` — signed sessions, private-Blob lease and mechanical outcomes.
- `platform-activity/{turn,event,worker}` — normalized activity and durable outbox worker.

## Components — `website/src/components/`

Top-level site: Hero, Nav, Footer, Problem, Method, Offers, Adoption, CliveSection, FounderProof, CitizenBuilder, CtaClose, FeatureHub, AskClivePanel, GlobalCliveLauncher, cast/video components, Journey and Seeds content.

Themed areas:

- `chapter1/` — study stage/shell, shared chat, video stage, hub, welcome, conversation, intake, paper trail and decision/right-panel portals.
- `aie-demo/` — AieDemoShell owns LoopState and the persisted ledger.
- `brain/` — curation shell, ProposalCard, shrine/workspace/jar/nameplate, intake, interaction review and paper trail.
- `command-centre/` — room shell, portrait door/loop/transition, StoryModeProvider and Clive/Doc/Pam rooms.
- `man/` — ReceivingWall and its CSS module.
- `platform/` — Court, health, agents, deployment, dispatch, fleet, coach and adoption shells.
- `platform-session/` — PlatformSessionProvider and controls. Provider is mounted in `app/layout.tsx`, separate from StoryModeProvider.
- `workshop-demo/`, `ui/`.

## Lib — `website/src/lib/`

- `auth/` — allow-list, email-code flow, Auth.js config, internal-role gate.
- `platform/operator-state.ts`, `platform/operator-store/`, `platform/enter-routing.ts` — six-fact operator state, Airtable/memory storage seam, and canonical resume routing.
- `brains/airtable-ids.ts` — live Brain and Operator State IDs.
- `brains/config.ts` — server-only tokens plus interaction read/write modes.
- `brains/handlers/` — logging, dual-read/review/upkeep, source-aware Household adapters, Receiving Wall, curation and promotion.
- `clive/` — prompt/context/fallback/continuity, reactions, video, voice and welcome.
- `aie-demo/` — loop data, brain client/templates, intake and localStorage ledger.
- `chapter1/` — books, labels and scene manifest.
- `curation/` — orchestrator, tools, knowledge, grounding, destinations and types.
- `command-centre/` — rooms, story mode, focus restore and portrait navigation.
- `man/receiving-wall-manifest.ts` and arch-mask utilities — Receiving Wall asset/portal geometry.
- `platform/` — Court/cast and shell data.
- `platform-activity/` — signed handles, lease store, envelope, route-neutral manifest, credential scrubber, rate card, create-only Airtable writer, reviewer PATCH module, Blob outbox/lock, deduplicating worker and sweeper.
- `agent-cast-assets.ts` — cast registry; Clive clip paths remain in `clive/video-reactions.ts`.

## Assets — `website/public/`

About 234 MB at this stamp. Main groups: `agent-cast/`, `brain/`, `audio/`, `video/`, `images/`, `seeds-of-promise/`, `workshop-demo/`. Loop convention: seamless MP4 plus frame-zero poster. Final Brain Vault state PNGs and shrine loops are under `website/public/brain/`. Court and Clive hero/gesture media were refreshed in the 4 Aug sweep.

## Docs

`website/docs/` currently contains six implementation packs: Chapter 1, Clive voice, app shells, command-centre clickthrough, platform telemetry, and the Receiving Wall portal spec.

The IA build and art-commission source material lives under root `docs/initiatives/`, not `website/docs/`; `ia-three-modes-build-plan.md` is present there. Always list root initiative docs before assuming a commission file’s exact path.

## Current House fact — 4 Aug 2026

`website/src/app/house/page.tsx` is a 1 KB authenticated placeholder. It states explicitly that the canonical route is stable from Phase 1 and that Phase 3 replaces the fitted-room placeholder with Kate’s room-registry collage. The Commission 1 Brain-Tree artwork is therefore the art source for a later implementation, not currently wired into the route.

## Telemetry visibility facts

Main contains:

- `website/src/app/api/platform-activity/worker/route.ts`
- `website/src/app/api/platform-sessions/sweep/route.ts`
- `CRON_SECRET` and `INTERACTION_WRITE_TARGET` in `website/.env.example`
- `household_activity` as an `InteractionWriteTarget` code value in `website/src/lib/brains/config.ts`

The checked-in env default remains `INTERACTION_WRITE_TARGET=brain_interactions`; `household_activity` is the cutover value documented in `platform-telemetry-flip.md`.

## Known repo noise

Do not import macOS ` 2` duplicates. Current refresh flags include:

- `website/components 2.json`
- `website/src/app/api/brains/interactions/action/route 2.ts`
- `website/src/components/FoundingCastHero 2.tsx`
- `website/src/components/ui/button 2.tsx`
- `website/src/lib/brains/handlers/interaction-action 2.ts`
- `website/src/lib/brains/handlers/interaction-upkeep.test 2.ts`
- `website/src/lib/brains/interaction-upkeep 2.ts`
- `website/src/lib/clive/load-context.test 2.ts`
- `website/src/lib/utils 2.ts`

`test-results/` and `tsconfig.tsbuildinfo` remain build noise. Deletion requires Matthew’s instruction.

## Refresh

Fetch the bundled `refresh_map.py`, set `REPO_BRANCH`, and run it via `RunWithCredentials`. It uses one recursive tree call and reports website structure plus duplicate flags.

## GitHub mechanics

- Use MCP branch/push/file/PR actions and `paramsFile` for substantial writes.
- MCP writes are text-only; binary assets use the GitHub web-upload path.
- Verify pushes with local git-blob SHA-1 against branch contents/tree SHA.
- `globals.css` and build-pack tails are append-hot; fetch fresh and verify before/after.
- Prefer per-feature CSS modules for new UI.
- Check commits, branches and PRs before claiming ownership.
