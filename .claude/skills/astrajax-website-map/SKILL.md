---
name: astrajax-website-map
description: Fast navigation of the astrajax/astrajax website codebase without directory-crawling. An annotated map of routes, components, lib modules, and asset conventions; session-start orientation ritual adapted for Claude Code local file access.
---

# astrajax-website-map

Verified 4 Aug 2026 against repository main @ `fa80cbd` (Merge PR #68, fix/receiving-wall-scroll-travel). Next.js App Router, React 19, TypeScript, Tailwind/PostCSS, shadcn. Tests: Vitest and Playwright.

The map decays. At every website session start, check recent commits before trusting it.

## Session-start ritual (Claude Code)

1. Load this skill for orientation.
2. Run `git log --oneline -20` and `git log --oneline -- website` to see what changed since the stamp above.
3. Read files directly with Read; use Grep for symbol hunting and confirm by imports.
4. If newer website work changes the map materially, flag to Matthew rather than carrying forward stale structure.

## Stack

Next.js App Router, React 19, TypeScript, Tailwind/PostCSS and shadcn on Vercel. Tests: Vitest and Playwright. Key files: `website/package.json`, `next.config.ts`, `tsconfig.json`, `.env.example`, `playwright.config.ts`, `vitest.config.ts`.

## Routes — `website/src/app/`

adoption; agents, agents/[slug]; aie-demo (redirects to /chapter-1; handlers remain); brain, brain/[slug], brain/[slug]/curate, brain/health, brain/intake, brain/review; chapter-1; coach; command/clive, command/doc, command/doc/build, command/pam; court; deploy, dispatch, fleet; journey (repo-kept; public disabled); seeds-of-promise.

## API — `website/src/app/api/`

ask-clive (public Q&A, Clive/Pam, governed streaming); clive-voice (OpenAI TTS proxy); chapter1/intake-chat (AI interview, fallback); chapter1/classify-user-brain (transcript re-read); brains/curation/* (multi-round); court/{deliberate,bicker} (engines); brain API (demo, promote, health, interactions, keys, paper trail). Platform telemetry (landed PR #38): platform-sessions/* (signed, Blob lease, outcomes); platform-activity/* (normalized, outbox worker).

## Components — `website/src/components/`

Site: Hero, Nav, Footer, Problem, Method, Offers, Adoption, CliveSection, FounderProof, CitizenBuilder, CtaClose, FeatureHub, AskClivePanel, GlobalCliveLauncher, cast/video. Themed: chapter1/* (study/shell, chat, video, hub, welcome, conversation, intake, paper trail); aie-demo/* (shell, loop state, ledger); brain/* (curation, card, shrine, workspace); command-centre/* (rooms, doors, loops, story mode); platform/* (Court, health, agents, deploy, dispatch, fleet, coach, adoption); platform-session/* (provider, controls); workshop-demo/*, ui/*.

## Lib — `website/src/lib/`

brains/airtable-ids.ts (live IDs); brains/config.ts (tokens, modes); brains/handlers/* (logging, read/review, adapters, curation, promotion); clive/* (prompt, context, fallback, reactions, video, voice); aie-demo/* (loop, client, templates, ledger); chapter1/* (books, labels, manifest); curation/* (orchestrator, tools, knowledge, grounding); command-centre/* (rooms, story, restore, navigation); platform/* (Court, cast); platform-activity/* (handles, lease, envelope, manifest, scrubber, rate, writer, reviewer, outbox, worker); agent-cast-assets.ts (registry; clips in clive/video-reactions.ts).

## Assets — `website/public/`

About 188 MB. Groups: agent-cast/, brain/, audio/, video/, images/, seeds-of-promise/, workshop-demo/. Loop convention: seamless MP4 + frame-zero poster.

## Docs — `website/docs/`

chapter1-craft-build-pack.md; clive-voice-t1-build-pack.md; app-shells-build-pack.md; command-centre-clickthrough-checklist.md; platform-telemetry-flip.md (env, Blob, cron, Airtable typecast, cutover; opening line stale post-merge).

## Known repo noise

Do not import macOS " 2" duplicates. test-results/, tsconfig.tsbuildinfo, .next/ are build noise. welcome-beat-1-talking.mp4 remains legacy-unused.

## Telemetry visibility (verified 4 Aug 2026)

Main contains:
- `website/src/app/api/platform-activity/worker/route.ts`
- `website/src/app/api/platform-sessions/sweep/route.ts`
- `CRON_SECRET` and `INTERACTION_WRITE_TARGET` in `website/.env.example`
- `household_activity` in `website/src/lib/brains/config.ts` as `InteractionWriteTarget` code value

Checked-in default: `INTERACTION_WRITE_TARGET=brain_interactions`; cutover value is `household_activity` per platform-telemetry-flip.md.

## Refresh note

A refresh script existed for the GitHub-API runtime (fetched the tree, printed structure, flagged duplicates). Claude Code refreshes this map by direct Read, so none is needed.
