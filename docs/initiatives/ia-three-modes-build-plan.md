# IA Three Modes — Build Plan v1.0

Execution plan for the approved IA Build Brief — *Website & App Restructure: Three Modes, the House, and the Shells v1.0* (Clive, 4 Aug 2026; Pam Cleared V2; Hal R1–R4 mapped). This plan translates the brief's §9 build order into dispatch packets for the Claude Code lanes, grounded in repo verification at current HEAD (`fix/receiving-wall-scroll-travel`, main @ `0d956b4`).

**Lanes:** `doc` (dispatch + Phase A design) → `doc-vercel-minion` (implementation in `website/`), `doc-brain-base-builder` (Airtable scaffolding), `kate` (scene-craft, branch-only). Art (room collage, dust sheets, Hal portrait, fast-path furniture) is Kathryn/Tara-Lee commission — **not gated on here**. Matthew merges everything.

**Agent-lane changes already made for this build:** `doc.md` and `doc-vercel-minion.md` now pin design work (schemas, auth, state contracts) to Doc's tier; the haiku minion implements approved designs only. Kate's four missing Hyperagent craft skills and the `fleet-activity-logging` runtime mis-tag are spawned as separate pre-build tasks.

---

## Preflight — verified repo facts

Checked directly at HEAD, 4 Aug 2026:

1. **No operator identity exists anywhere.** No `middleware.ts`, no cookie usage in `website/src`, no sign-in surface. The brain-key/grant infrastructure (`src/lib/brains/guards.ts`, `grants-store.ts`) authenticates *agent personas* (`clive | pam | doc`) against ephemeral `sessionId`s — it is authorisation plumbing for agent access to brains, not human identity. §2's "verified identity" has no existing mechanism to extend for the *authentication* half.
2. **The server-side persistence seam is real.** `src/lib/brains/store/airtable-store.ts` (with `memory-store.ts` for tests, switched via `config.ts`) persists grants/requests to the Registry base (`appbdTVHevH6Bl5ZZ`). Operator state records can ride the same pattern — the brief's "named authority" holds for *storage*.
3. **Journey persistence is device-local**, confirming Pam's defect: `localStorage` in `chapter1/CliveChatSurface.tsx`, `aie-demo/user-brain-intake.ts`, `platform-session/PlatformSessionProvider.tsx`, `command-centre/StoryModeProvider.tsx`.
4. **App-shells pack assumptions hold at HEAD** (§8 preflight item 1 done): no web manifest exists, `public/app-icons/` namespace free, no `viewport`/`appleWebApp`/`manifest` config in `src/app/layout.tsx`.
5. **Back-of-house routes are ungated:** `/command`, `/dispatch`, `/deploy`, `/fleet` exist under `src/app/` with no role check of any kind. §1's gating is net-new work.
6. **Showroom seam exists:** `/api/brains/demo` + `src/lib/brains/handlers/demo-seed.ts` — the seeded-demo precedent the brief names.
7. **Telemetry flip** is documented (`website/docs/platform-telemetry-flip.md`) but Phase 6 must re-verify it has *landed* before Hal surfaces build.

## Decision required before Phase 1 builds: the auth mechanism

Fact 1 above triggers the brief's kill criterion **at planning time, which is the cheap place to hit it**: identity cannot be carried server-side without a platform choice. The state contract's *storage* needs no platform change; its *authentication* does. Options, in ascending weight:

- **A. Custom signed-cookie session + email magic link.** Operator table in the Registry base; a signed httpOnly cookie; a send-code/verify pair of API routes. No new vendor; smallest footprint; most code to own (token signing, replay, expiry). Fits the existing house pattern (everything else is hand-rolled on Airtable).
- **B. Auth.js (NextAuth v5) with email provider.** Standard Next.js answer, session JWT or DB-backed; adapter would be custom (Airtable) or a small KV. Vendor-free but adds a framework dependency and its opinions.
- **C. Clerk (or similar hosted auth).** Fastest to correct, least to own; adds a paid third party holding operator identity — a real decision for a product whose pitch is context sovereignty.

**DECIDED — Matthew, 4 Aug 2026: Option B, Auth.js (NextAuth v5) with an email provider.** Session strategy and the Airtable (or small-KV) adapter shape are Phase 1 Phase-A design detail; the operator/state schema is unchanged by this choice. The kill criterion is closed — identity carries server-side via a deliberate platform decision, not a cookie-brittle approximation.

---

## Phase 0 — Enablers (parallel, now)

| Item | Owner | Notes |
|---|---|---|
| Auth mechanism decision (above) | Matthew | Gates Phase 1 build only |
| Apple Developer enrolment (~$99/yr) | Matthew | Long pole for S2; nothing else waits |
| Port Kate's 4 Hyperagent craft skills | Doc's Workshop (task spawned) | `responsive-scene-recomposition` needed by Phase 3 |
| Fix `fleet-activity-logging` runtime tag | Doc's Workshop (task spawned) | Unblocks logging duty for all Claude Code lanes |
| Art commissions: room collage, dust sheets, Hal portrait, fast-path furniture, wall edit | Kathryn/TL | Separate commissions; build does not gate |

## Phase 1 — State contract + `/enter` (the gate)

**Lane:** `doc` designs (Phase A, now) → `doc-brain-base-builder` scaffolds the Airtable side → `doc-vercel-minion` implements routes.

**Design deliverable (Doc, Phase A):**
- **Operator state schema** — one operator record binding the six facts (§2): current chapter/step · owned brain IDs · configured household functions · introduced members · permissions · last safe destination. Lives in the Registry base beside the grant tables; read/written through the `store/` seam (both backends, so tests stay hermetic).
- **Session model** per the auth decision (cookie shape, expiry, refresh).
- **`/enter` routing function** — pure, unit-testable: `(identity, state, query) → destination`, covering all five hierarchy cases including the explicit-recovery state. State-transition tests live with it.

**Implementation (minion, Phase B):**
- `src/app/enter/` route + `src/lib/platform/operator-state.ts` (or similar) + auth routes per decision.
- Journey progress writes move server-side (Chapter 1's localStorage becomes an accelerator only — never the decider).
- `/` untouched: no redirect logic, ever.

**Acceptance:** all five `/enter` cases route correctly · cleared-cookie/new-device operator resumes exactly · contradictory state yields the recovery choice, never a guess · "brain exists" never routes.

## Phase 2 — Route housekeeping (parallel with Phase 1 build)

**Split lane:**
- `doc-vercel-minion`: `/man` → `/man/receiving-wall` and `/command` → gated index redirects; **role-gating for `/dispatch`, `/deploy`, `/fleet`, `/command/*`** (401/404 by role, not obscurity — depends on Phase 1's session for the operator-role check, so gating lands with or just after it; redirects can land immediately).
- `kate`: remove the Doc's-Minions cluster from `FoundingCastHero.tsx` (recognition-only wall, also satisfies Hal's R4). Branch `kate/wall-minion-cluster`, cites the craft build pack.

## Phase 3 — The House v1

**Lane:** `kate`, with the registry type agreed with Doc first.

- **Room registry** as a typed manifest module (house convention — geometry as data): owner · job · destination · four status predicates (§3) · display order · showroom behaviour. Eight rooms per the brief's table; ninth-room-by-registry-only is the acceptance test.
- **Four-state render logic:** dust sheet = ¬introduced ∨ ¬configured only; fitted-room state for introduced-but-quiet; no entry invitation without authorisation; **unlock by function, never narrative pacing**.
- **Two presentations, one route:** journey (collage as progress artefact) and daily (Continue · Needs attention · Recently visited fast path — art register is Kathryn/TL's; Kate wires function behind placeholder furniture).
- Rooms launch pointing at existing destinations (`/court`, `/brain`, `/man/receiving-wall`, `/coach`); Physician's and Lodge ship shrouded.
- Dust-sheet Clive lines: Kate drafts, Matthew approves (register work).

**Predicate sources:** *Introduced* ← journey state (Phase 1) · *Configured* ← household setup state · *Authorised* ← permissions · *Available now* ← live function state. The registry consumes the state contract; it never re-derives it.

## Phase 4 — Journey extension

**Lane:** `kate` (chapter scenes, exits) + `doc-vercel-minion` (persistence wiring).

- Chapters 2 (mine & structure) and 3 (meet the household) extending `/chapter-1`'s pattern.
- Functional exits: chapter map · save & leave · resume later (server-side, any device) · enter available House · return to current step.
- Each introduction beat flips the room's *Introduced* fact via the state contract — the House fills as the journey proceeds.

## Phase 5 — Showroom

**Lane:** `doc-vercel-minion`. Read-only demonstration state on the `/api/brains/demo` seeded seam: complete House, every room lit, unmistakably labelled, zero writes, zero live credentials, reached by explicit request only (`/enter` option, marketing CTA, sales link). Acceptance: instrumented proof the showroom session issues no write calls.

## Phase 6 — Hal surfaces (gated on telemetry flip landing)

**Lane:** `doc-vercel-minion` (surfaces) + `kate` (Physician's Room interior) + Kathryn/TL (Hal portrait — commission from Phase 0).

- R1 split: internal consulting room at `/command/hal` (operator-gated via Phase 2's role check) · customer Physician's Room in the House registry (added as a registry entry — exercising the ninth-room acceptance path for real).
- R2: vitals strip on `/agents/[slug]`, customer register.
- R3: Not-Graded as a designed fitted-room state — same honesty rule as §3.

## Phase 7 — Shells

**Lane:** `doc-vercel-minion` per the app-shells pack (`website/docs/app-shells-build-pack.md`), assumptions re-verified above.

- **S1 PWA** immediately behind Phase 1: manifest + icons, `start_url: "/enter"` (flip from `/` in a follow-up if S1 somehow ships first), no service worker (D2, aged stronger), no secrets in shells (D1, permanent).
- **S2 Tauri:** unsigned artifact → signed `.dmg` (needs Phase 0 enrolment). Definition of done includes webview session persistence across quit/relaunch against the Phase 1 cookie.
- Open calls 1–4 (app name, icon direction, theme colour, footer copy) remain Matthew's.

---

## Sequencing

```
Phase 0 ──┬─ auth decision ──► Phase 1 (state contract + /enter)
          │                        │
          │     Phase 2 redirects ─┤ (gating lands with P1 session)
          │     Kate wall edit  ───┘  (independent, can land any time)
          │                        ▼
          │                    Phase 3 (House v1) ──► Phase 4 (Journey) ──► Phase 5 (Showroom)
          │                        │
          ├─ telemetry flip ──► Phase 6 (Hal)
          └─ Apple enrolment ─► Phase 7 S2   (Phase 7 S1 rides right behind Phase 1)
```

Every phase is usable on its own; one workstream = one PR = one concern; all branches (`kate/*`, minion branches), Matthew merges. Every Phase B ends with the mandatory `clive-man` context-sync handoff.

## Kill criteria (restated, now sharpened)

- The auth-provider fork has been surfaced pre-build (this document) — the "stop and return to Matthew" condition is already satisfied by the decision section above. No cookie-brittle approximation ships under any option.
- If the telemetry flip has not landed when Phase 6 is reached, Phase 6 waits — no mock vitals.
