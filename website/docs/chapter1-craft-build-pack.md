# Chapter 1 & Clive Instance — Craft Build Pack v0.4

**Status:** Locked v0.1 (PR #13). v0.2 with W5b (#16); v0.3 with the landings PR (#21); v0.4 closes the build with W7.
**Owner:** Kate (scenic workshop). **Approver:** Matthew. **Visual finish authority:** Kathryn / Tara-Lee.
**Evidence base:** `main` @ `b00705b`, verified 6 Jul 2026 (website map + direct reads + five scout passes). v0.2 deltas @ `35b3818`; v0.3 deltas @ the #19 merge.
**Origin thread:** `cmr9bbfqo4asd07ad99socn41`.

## v0.3 changelog (7 Jul, morning)

- **W5b shipped** (PR #16): AI-led intake interview + transcript re-read. One build lesson recorded: a `typeof data` cast on a null-initialised variable broke the Vercel build (CFA resolves it to `null`); named response types are now the house style for fetch casts. The sandbox has no local `tsc` — Vercel is the type gate until a local typecheck is set up (offered, unscheduled).
- **W8 shipped** (PR #17, unplanned workstream from Matthew's "remember me?" field test): loop slice persists in localStorage (one-time migration) and the loop context carries a continuity directive — recall from the ledger, never beyond it.
- **W2 shipped** (PR #18): reaction dramaturgy as data in `lib/clive/reaction-map.ts`. Engine and 0.72 playback rate untouched (Matthew's rollback flag honoured — taste rollback = delete a map line, full rollback = revert one commit). Start-again sigh deliberately dropped: reset navigates instantly, the reaction could never be seen.
- **W5 shipped** (PR #19): the Architect's Journal — right page present from question one, inking live from the W5b per-turn capture (or scripted answers). Per-answer `pleased` removed in step with W2.

## v0.4 changelog (7 Jul, closing sweep)

- **W4 shipped** (PR #24): paper trail resurrected as the ledger tab + drawer, render-slot plumbing (stage stays state-ignorant). **W6 shipped** (PR #25): docket counts became real buttons opening list views; pending proposals still supersede.
- **W7 shipped** (this PR): hub hotspots + glow media moved to a scene manifest (`lib/chapter1/hub-manifest.ts` — typed data module, geometry as data per house convention); bookmark **resume ribbon** on the hub (ledger slice now records the book; `?resume=1` re-enters at the persisted step); **reaction clip pre-warm** on the video stage (idle-time, ~7.5MB, Save-Data and reduced-motion aware); `/aie-demo` now **redirects** to `/chapter-1` preserving query params (externally visible — 307, upgradeable to permanent).
- **room-scripts disposition settled:** no live consumer anywhere (code-search complete-index zero + all traced paths). The 8 per-step narrations are good content — earmarked for guide-mode narration (Light/No-Story) or removal; Matthew's call. No deletion performed.
- **" 2" duplicate sweep deliberately skipped** — file deletions need explicit instruction; the noise list stays in the website map.
- **Video weight audit (145.3MB total across 30 files):** the five Brain shrine loops are the heavy end (11.5–13.5MB each, 62.4MB combined) — prime candidates for the CRF-20 recipe that cut book-glow 3×. Pam's idle-loop 11MB (known, pre-stage-use encode still required). `welcome-beat-1-talking.mp4` (4.5MB) is legacy-unused — removal candidate, Matthew's call. Everything else ≤3.2MB and proportionate.

## Backlog (recorded, unscheduled)

- **Server read-back of the Workshop user-brain save** — cross-device / cleared-storage "remember me". Verified 6 Jul: `/api/chapter1/user-brain` is save-only; read-back is new API surface (GET by session id + Workshop query shape verification first).
- **Local typecheck for the workshop sandbox** — `tsc --noEmit` pre-push; needs a one-time npm registry access grant.
- **Brain shrine loop re-encodes** (CRF-20 recipe, ~62MB → ~20MB estimated) and the `welcome-beat-1-talking.mp4` removal call.
- **room-scripts.ts** — wire as guide-mode narration or remove.

## v0.2 changelog (6 Jul, evening)

- **W1 shipped** (PR #14, merged): textarea, scroll pinning + fresh-ink chip, retry, SR status node, transcript persistence, returning-architect greeting, additive `onError` prop. StudyAssistantText verify item settled — the existing reduced-motion CSS block covers `studyLineIn`.
- **Unplanned defect fix** (PR #15, merged): intake off-by-one — displayed question ran one ahead of the stored field. Root-caused from Matthew's field transcript.
- **W5b added (Matthew's direction, supersedes the in-chat W5a proposal):** the intake interview becomes AI-led — canned clarification explainers rejected as a patch on a quiz. See W5b below.
- **W7 delta:** book-glow pre-warm + lighter encodes already shipped via PRs #10/#11 (sibling thread) — strike that item from W7.

## Purpose

One page of locked decisions for the Chapter 1 / shared-Clive-instance craft build, so every PR cites this pack instead of re-litigating sequencing, file ownership, or constraints. Drift control, not ceremony.

## Scope

Presentation-layer craft pass on Chapter 1 in Clive's study and every mount of the shared chat instance (`CliveChatSurface`): homepage Ask Clive, GlobalCliveLauncher, intake interview, Chapter 1 loop, Curate sitting.

**Out of scope:** canon records, product/client agents, new art (Kathryn/TL commission only), copy changes that alter public claims (any such change must be called out in its PR description for conscious gating).

## Ground truth (scout-verified, 6 Jul 2026)

- **Curate reuses the full study stage and chat surface.** `CurateWithCliveShell` wraps `CliveStudyShell`, mounts `CliveChatSurface` with `onCustomSend` → `/api/brains/curation/chat`, seeds the transcript via `initialMessages` (docket monologue). Its docket counts render as plain `<li>` text — not interactive. It holds a `CliveVideoStageHandle` ref but never triggers reactions.
- **Layout:** single stylesheet (`globals.css`), hand-written classes, absolute positioning via CSS custom properties + `clamp()`. Left page = `.study-stage__content`; right page = `.study-stage__clive-spot` + `.study-stage__right-panel`. Decision cards reach the right page via `createPortal` (`StudyStageDecisionPanel` → `StudyStageRightPanel`); `.chapter1-conversation__actions` stays in left-page flow. Below 1024px the custom properties rescale — pages never stack.
- **Existing motion vocabulary:** `studyLineIn` 420ms, `studyPromptIn` 500ms, `cliveThinkingPulse` 1.4s, welcome fades 700ms (CSS + JS state machine). Reduced-motion: three CSS blocks + `usePrefersReducedMotion` hook.
- **CRITICAL — Agent plates on books:** Whenever an agent still or video sits on a Living Folio / book page, the plate must dissolve into the parchment on **all four sides** with the same papery deckle (no hard crop / ruler line through the figure, especially at the bottom). Welcome and other body copy sit *below* that dissolve — they are not the plate edge. Curated MP4s stay the media; REF supplies the **border only**. Stack: `.study-stage__clive-plate` clips with luminance matte `https://cvu4l5kwtlocutgd.public.blob.vercel-storage.com/folio/masks/clive-folio-deckle-v9-4k.png` (`mask-mode: luminance`); sibling `.study-stage__clive-ink` paints `clive-folio-deckle-ink-v9-4k.png` outside that clip (nested feather/poster/layer masks stay off — not soft `radial-gradient` alone). Keep the plate at the matte’s native aspect (`1024 / 755`). Teaching = left page; interaction = right top-third. Cursor mirror: `.cursor/rules/folio-agent-plate-deckle.mdc`.
- **Reactions:** `sigh`/`glance` unused anywhere traced; reactions fire only on chat turns, never on decision clicks. Extra unwired Clive clips on disk: `lips-moving-natural.mp4`, `welcome-gesture.mp4`.
- **Pam has a body waiting:** canonical hero art (`pam-portiscue/hero.png|mp4|poster.jpg`) plus an **unwired** `animations/idle-loop.mp4` (11MB — needs a lighter encode before stage use), flagged pending in `INGEST-NOTES-pam-doc.md`. The `agent-cast-assets.ts` registry has `heroStatus` per character but `animations: []` for all 13 — clip paths are hard-coded in `video-reactions.ts` instead. Systemic wiring gap, not Pam-specific.
- **`StudyAssistantText`:** per-line staggered fade (100ms/line, 1200ms cap), no reduced-motion handling in the component itself — verify the `globals.css` reduced-motion block covers `studyLineIn` before touching it.
- **`PaperTrailDrawer` is orphaned on `main`** — no importer across the traced render path (7 files checked). W4 is a resurrection.
- **`/aie-demo` duplicates `/chapter-1`** — both render `AieDemoShell`. Consolidation candidate (W7).
- **`room-scripts.ts`** holds 8 per-step narration beats (clive/pam/doc speakers) with no traced consumer — verify or wire (W7).

## Workstreams — one PR each, in this order

### W1 — The shared organ: `CliveChatSurface`
**Files owned:** `CliveChatSurface.tsx`, `StudyAssistantText.tsx` (only if streaming interplay requires), `globals.css` (`.clive-chat` block only), `AskClivePanel.tsx`, `GlobalCliveLauncher.tsx`.
**Changes:** auto-growing textarea (Enter sends, Shift+Enter breaks; `maxLength` prop-driven); scroll pinning with "fresh ink" chip; retry-on-error re-sending the last user turn, failure copy in Clive's voice; move `aria-live` to a hidden status node, announce completed turns once; opt-in `persistTranscript` prop (sessionStorage, keyed by sessionId) enabled for Ask Clive panel + launcher; returning-architect greeting — panel/launcher read the persisted Chapter 1 intake slice into `loopContext` so Clive greets by name (client-side only, data already captured).
**Contracts that must not break (Curate depends on them):** `onCustomSend(message, history)` signature; `initialMessages` seeding; `transcriptOnly`.
**DoD:** all five mounts pass manually; Curate proposals flow unchanged; keyboard + screen-reader pass; input growth doesn't break left-page flow at 767px/1024px breakpoints.

### W2 — Reaction dramaturgy
**Files owned:** `Chapter1Conversation.tsx`, `CurateWithCliveShell.tsx`, `lib/clive/video-reactions.ts` + new beat→reaction map module, `agent-cast-assets.ts` (animations wiring only if Pam presence is approved).
**Changes:** reactions on decision moments (approve → `pleased`; promote/filed → `pleased`; Start again → `sigh`); Pam beats → Clive `glance` when she takes the floor, `sigh` on a rough sniff note; de-repeat `pleased` (beat-scoped mapping as data, not scattered callbacks); wire the same map into Curate's existing stage ref.
**Pending Kathryn/TL:** Pam's visible presence in her beats (calling card vs framed portrait vs idle-loop vignette — assets exist).
**DoD:** no reaction spam; reduced-motion path untouched (`playReaction` already gated).

### W3 — The book behaves like a book
**Files owned:** `globals.css` (new keyframes), `Chapter1Conversation.tsx` (step-transition wrapper), `StudyStageRightPanel.tsx` (card-settle hook).
**Changes:** page-turn transition between loop steps (~400ms crossfade + gradient sweep + page shadow, extending the existing `studyLineIn` vocabulary); right-page cards settle onto the desk (slide + shadow ease) instead of popping.
**Optional (Kathryn/TL):** framed brain maturity object — reuse existing health-state paintings, swap at `doc_handoff` when `brainMaturity` flips seedling → working.
**DoD:** fully disabled under reduced-motion; no layout shift on the portrait; feather mask untouched.

### W4 — Paper trail on the desk (resurrection)
**Files owned:** `CliveStudyStage.tsx`, `PaperTrailDrawer.tsx`, `globals.css` (ledger + drawer classes).
**Changes:** ledger hotspot on the stage (percentage-positioned `<button>`, aria-label, varnish-glow focus ring per house input rules) opening `PaperTrailDrawer`; drawer already builds its trail from `LoopState`.
**DoD:** keyboard reachable, Escape closes, works at all breakpoints.

### W5 — The Architect's Journal (intake presence)
**Files owned:** `UserBrainIntakeChat.tsx` only.
**Changes:** right-page journal card that inks in each captured intake field as it lands (existing `StudyStageDecisionPanel` portal + `studyLineIn` entrance); the profile card remains the completion state.
**DoD:** no left-page layout shift; screen reader announces each capture once.

### W5b — AI-led intake interview (added v0.2 — Matthew's direction)
**Files owned:** `lib/aie-demo/intake-agenda.ts` (new), `app/api/chapter1/intake-chat/route.ts` (new), `app/api/chapter1/classify-user-brain/route.ts`, `UserBrainIntakeChat.tsx`.
**Direction (Matthew, 6 Jul):** "it truly needs to be AI so that users can clarify. Once complete, the AI needs to re-read the chat."
**Changes:** Clive interviews from an **agenda, not a script** — the seven fields each carry an approved plain-words explainer he offers when asked what a question means (deterministic content, AI delivery). New `/api/chapter1/intake-chat` follows the ask-clive house pattern (`CLIVE_MODEL`, JSON-only contract `{reply, captured, done}`, per-turn running capture, ~20-turn bound). On completion the classify route receives the **full transcript and re-reads it as the authoritative pass** — extracting all seven fields from everything said before classifying. The scripted engine survives intact as the booth-safe fallback: no key, model error, or bad JSON mid-interview bridges captured fields into the script at the first uncovered question, so intake never dead-ends.
**Contracts:** `LoopState.userBrainIntake` shape unchanged (downstream themes, journal, loopContext, Workshop save all inherit); `CliveChatSurface` untouched.
**DoD:** clarifying questions get explanations, not rejections; short answers pass; fallback bridge verified by testing with the model path disabled; scrambled-slot regression from #15 impossible by construction (fields extracted holistically).

### W6 — Curate docket made physical
**Files owned:** `CurateWithCliveShell.tsx`, `ProposalCard.tsx` (if list rendering is shared), `globals.css` (docket classes).
**Changes:** the four docket counts become real buttons opening their lists (drafts / flagged / trusted / source docs) on the right page — the UI keeps the monologue's promise ("ask me to summarise any item"). Data already present in `CurationDocket`.
**DoD:** counts keyboard-operable; pending-proposal state still supersedes the docket view.

### W7 — Housekeeping & delivery
**Files owned:** `CliveStudyHub.tsx`, new scene-manifest JSON, `lib/chapter1/hub-books.ts`, asset audit notes.
**Changes:** hub hotspots move to a per-room scene manifest (house convention); resume bookmark ribbon on the hub when a persisted `currentStep` exists; warm the three chat reaction clips after the idle reel starts; MP4 weight audit for the route (Pam's idle-loop needs a 720p encode before any use); settle `room-scripts.ts` (wire as step captions or flag for removal); `/aie-demo` route consolidation proposal (redirect to `/chapter-1` — externally visible, so explicitly flagged in the PR); Route A note for the next hub-art regeneration (blank spines, live titles); " 2" duplicate-file sweep (already mapped).

## Sequencing rationale

W1 → W2 → W3 → W4 → W5 → W6 → W7. W1 first: five mounts depend on the organ, and later workstreams edit its callers — reversing the order rewrites freshly-touched files. W3 follows W2 because both edit `Chapter1Conversation.tsx` (the transition wrapper wants the final reaction hooks in place). W4/W5/W6 are page-local with disjoint file ownership and may run in parallel once W3 lands. W7 closes, including the website-map skill refresh.

## Drift controls

1. Every PR description cites this pack and its workstream id.
2. One workstream = one PR = one concern; small commits, plain-language messages.
3. The file-ownership lists above are exclusive — no two open branches may touch the same file.
4. Contract changes to `CliveChatSurface` props require a pack revision (v0.2) in the same PR.
5. After the final merge: refresh the `astrajax-website-map` skill per its own docs so the next session inherits reality.
6. Presentation-only mandate: any change that would alter public claims or substantive copy is named in its PR description for conscious gating.

## Open calls for Kathryn / Tara-Lee (Matthew arbitrates)

1. **Pam's presence** in her beats — calling card, framed portrait, or idle-loop vignette (assets exist; encode needed).
2. **Page-turn feel** — sweep direction, shadow weight. W3 ships a restrained default with a PR video for judgement.
3. **Framed brain maturity object** — reuse of existing health-state paintings; optional.
4. **Ledger / paper-trail desk object** styling.

## Governance

All work is Green/Amber presentation-layer change on `kate/*` working branches; Matthew's merge is the gate; no canon, no credentials, no schedules. Per the Autonomy & Gating Policy, structure bounds the risk — no additional review loops are manufactured.
