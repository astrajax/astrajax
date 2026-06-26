# Chapter 1 Workbench — Vercel Build Plan

**Status:** Active build brief for the Vercel Minion (`@doc-vercel-minion`).
**Owner:** Matthew. **Dispatcher:** Doc. **Implements:** Vercel Minion (Composer).
**Read with:** `docs/business/architecture.md` (the loop), `docs/initiatives/brain-key-wiring.md` (API contracts), `docs/initiatives/brain-key-schema.md` (data shapes), `docs/initiatives/aie-build-plan.md` (sprint scope and do-not-build list).

This is the approved middle ground from the Pam pass on 24 Jun: **a real Chapter 1 workbench on Vercel, not a static booth demo and not a platform.** Depth on one governed loop, breadth shown as receipt cards.

---

## Decision locked

- **One route, real contract, memory mode by default.** The workbench calls the existing `/api/brains/*` routes. With `BRAIN_KEY_USE_MEMORY=true` it runs offline with believable seeded results. Flip the flag plus add tokens and the same UI runs live against the three Airtable bases.
- **Depth, not breadth.** Build the full governed loop end to end. Everything downstream of the approved brief is a receipt card, never a screen.
- **Spend the build speed on the loop quality**, not on extra surfaces.

The single sentence the route must prove in five seconds:

> AstraJax turns a domain expert's messy knowledge into a governed brain that agents can safely use.

---

## Routing

**Minion:** Vercel Minion. All work is in `website/`.

**Vercel plugin skills (read each before its slice):**

| Skill | Used for |
|-------|----------|
| `nextjs` | App Router route, client shell, state machine |
| `vercel-functions` | Server-side proxy for privileged approve/promote calls |
| `ai-sdk` | Clive and Pam reply generation (optional; seeded text is the fallback) |
| `env-vars` | Mode flag and secret handling, no new env names |
| `verification` | End-to-end check after the build, dev server up |

`shadcn` is out unless Matthew asks. Match existing Tailwind and `@/` import conventions.

---

## The loop (from architecture.md §3)

Narrative step machine the shell owns:

```text
user_brain -> guide -> clive_interview -> business_brain
  -> pam_challenge -> human_decision -> doc_handoff -> context_access -> receipts
```

Hard rules:
- `doc_handoff` cannot run until `human_decision` records an approval. Doc acts only from an approved brief (Rule 5).
- `context_access` cannot run until Doc promote completes (`brainMaturity: working`). Seedling = Workshop only — no context retrieval in the demo.

The **context access sub-state** (locked / awaiting_approval / unlocked / expired) is separate from the narrative step. Reuse helpers in `website/src/lib/brains/ui-states.ts`. User-facing copy says **approved context**, not Brain Key — Brain Key is backstage engineering only.

---

## Files to create

```text
website/src/app/aie-demo/page.tsx                      (server: renders shell)
website/src/app/aie-demo/approve/route.ts              (server proxy: injects admin secret)
website/src/app/aie-demo/promote/route.ts              (server proxy: injects doc-promote secret)
website/src/components/aie-demo/AieDemoShell.tsx       (client: owns loop state)
website/src/components/aie-demo/Stepper.tsx
website/src/components/aie-demo/steps/UserBrainStep.tsx
website/src/components/aie-demo/steps/GuideModeStep.tsx
website/src/components/aie-demo/steps/CliveInterviewStep.tsx
website/src/components/aie-demo/steps/BusinessBrainStep.tsx
website/src/components/aie-demo/steps/PamChallengeStep.tsx
website/src/components/aie-demo/steps/HumanDecisionStep.tsx
website/src/components/aie-demo/steps/DocHandoffStep.tsx
website/src/components/aie-demo/steps/ContextAccessStep.tsx
website/src/components/aie-demo/steps/ReceiptsStep.tsx
website/src/lib/aie-demo/demo-data.ts                  (seeded client, user brain, drafts, Pam output, receipts)
website/src/lib/aie-demo/brain-client.ts              (browser client for /api/brains/* + proxies)
website/src/lib/aie-demo/types.ts                      (loop state, step ids)
```

No changes to `website/src/lib/brains/*` server logic. If a gap appears there, stop and route back to Doc.

---

## API wiring (existing contracts)

All routes are `POST`, JSON, server-only Airtable. Responses pass through `sanitizeForClient()`. Full detail in `brain-key-wiring.md`.

| Step action | Route | Notes |
|-------------|-------|-------|
| *(Seedling — no API)* | — | Clive interview ends in Workshop-only state; no key request |
| Human approves brief | *(local state only)* | Records approval for Doc handoff — not a Brain Key approve |
| Doc promotes draft | `POST /api/brains/doc/promote` | **doc header** `x-brain-doc-promote`; sets maturity to Working |
| Agent asks for context | `POST /api/brains/key/request` | After Working maturity only; body: brainSlug, persona, purpose, scope, reason, sessionId |
| Human approves access | `POST /api/brains/key/approve` | **admin header** `x-brain-key-admin` — via server proxy |
| Use approved context | `POST /api/brains/truth/retrieve` | body: grantId, sessionId, persona, brainSlug, scope |
| Log the exchange | `POST /api/brains/interactions/log` | manifest = record IDs + hashes, not full text |

### Secret invariant (do not break)

The browser must never receive `BRAIN_KEY_ADMIN_SECRET` or `BRAIN_DOC_PROMOTE_TOKEN`. The two privileged actions (approve, promote) go through the new server proxy routes under `website/src/app/aie-demo/`, which read the secret from `process.env` server-side and forward to `/api/brains/*` with the correct header. Request, retrieve, and log can be called directly from the browser client.

---

## Data and modes

- **Booth mode (default):** `BRAIN_KEY_USE_MEMORY=true`. Seeded data drives the visible content; the brain routes return believable in-memory results. No tokens, Wi-Fi-proof for the contingency pack.
- **Live mode (later, no UI change):** set `BRAIN_KEY_USE_MEMORY=false` and add the scoped `BRAIN_*` tokens in Vercel. Same screens write to Workshop and read Trusted Brain after approval.

Seeded fixtures in `demo-data.ts`:

- Fake client: a commercial operations team with messy context and low agent trust.
- User brain: strong commercial judgement, low context-environment confidence, medium AI confidence (drives Clive tone and Pam sensitivity).
- Business brain draft: purpose, workflows, source context, approval rules, known gaps.
- Pam sniff test: strongest part, weakest assumption, missing evidence, rabbit-hole risk, safe to send to Doc.
- Receipts: fleet proposal, HyperAgent package, Doc action log, adoption loop, Butternut proof drawer.

---

## Build slices (each is one visible asset)

### Slice 1 — Shell, state machine, stepper
- `/aie-demo` loads, booth headline reads in five seconds.
- Left-hand stepper or top flow; every step has one obvious next action.
- Reset/replay control for recording.
- **Done when:** the full loop is clickable end to end with placeholder panels.

### Slice 2 — User Brain + Business Brain
- User brain selection visibly changes Clive tone and Pam sensitivity.
- Business brain renders as structured context, not a form dump.
- **Done when:** the screen says "AstraJax maps the human before it maps the business" without narration.

### Slice 3 — Clive interview + Brain Key request
- Clive reasons and drafts proposed context.
- "Ask to unlock trusted context" calls `key/request`; UI shows `awaiting_approval` via `ui-states.ts` copy.
- **Done when:** Clive is visibly blind to trusted context until approval.

### Slice 4 — Pam challenge + Human decision
- Pam sniff test panel (calibrated by user brain).
- Approval moment calls the `approve` server proxy, returns an active grant; `retrieve` then returns prompt-safe snippets.
- Ownership line shown verbatim:

```text
This is your decision. You now have context-aware, bias-checked opinions. You decide.
```

- **Done when:** Doc cannot act before this approval, and approval flips the access sub-state to `unlocked`.

### Slice 5 — Doc handoff
- Approved brief routes to the `promote` server proxy; show the change-log receipt and quarantined draft.
- **Done when:** the paper trail (approver, reason, executing agent Doc) is visible.

### Slice 6 — Receipts panel
- Fleet proposal, HyperAgent package, adoption loop, proof drawer — cards only.
- **Done when:** they read as outputs of the context layer, not half-built tabs, with HyperAgent clearly the runtime partner.

### Slice 7 — Verification pass
- Run `verification` patterns with dev server up; confirm the full click-through and the reset control.
- Run `npm run test:brain-key` if any brain lib was touched (it should not be).

---

## Out of scope (do-not-build list, enforced)

Auth, billing, database, multi-tenant, real HyperAgent API sync, full Court Mode, admin settings, live analytics, agent marketplace, multiple character skins. If tempting, write it as a receipt card.

---

## Manual steps for Matthew

- Booth mode: nothing. It runs offline once built.
- Live mode (optional, later): add scoped `BRAIN_*` tokens in Vercel, set `BRAIN_KEY_USE_MEMORY=false`, redeploy. No code change.

---

## Acceptance

- Route loads at `/aie-demo` and runs start to receipts on local state.
- The governed loop is real: request, approve, retrieve, log, promote all fire through the live API contract in memory mode.
- No secret reaches the browser (approve and promote go through server proxies).
- The approval moment is explicit and gates Doc.
- Copy is monitor-readable; no tiny text, no production rabbit holes.
- `npm run dev` from `website/` serves it; no build or type errors.

---

## Handoff

Vercel Minion: build slice by slice, report a diff summary and the local verify path (`cd website && npm run dev`, open `/aie-demo`) after each slice. Do not commit or deploy to production unless Matthew asks in the same thread.
