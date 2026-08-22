# AstraJax website

Next.js App Router app for the AstraJax product and marketing surface. Vercel builds and hosts it as a real server app — not a static export. There is no `website/out/` folder to upload.

Copy uses canonical claims from [`docs/business/positioning.md`](../docs/business/positioning.md).

## Stack

- **Next.js** (App Router) + React
- **next-auth** (Auth.js) for operator sign-in (`/enter/sign-in`, `/api/auth/*`)
- **Neon** for the optional context-index search layer (`DATABASE_URL`; Airtable stays the system of record)
- **Vercel Blob** for media (Living Folio / furniture) and onboarding uploads
- **API routes** under `src/app/api/` (Ask Clive, Brain Key, receiving wall, court, platform activity, and more)
- **Playwright** for end-to-end tests; Vitest for unit tests

## Local preview

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000

If `website/.env.local` is missing, copy `website/.env.example`. For local Brain Key work, `BRAIN_KEY_USE_MEMORY=true` runs an in-memory store (no Airtable required). Ask Clive still returns a canned fallback when `ANTHROPIC_API_KEY` is empty.

## Tests

```bash
npx tsc --noEmit
npm run test:brain-key
npm run test:command-centre
npm run test:platform-activity
npm run test:e2e
```

`npm run test:e2e` needs Playwright browsers once: `npx playwright install`. Prefer `npx tsc --noEmit` over `npm run lint` for a non-interactive static check.

## What's in the app

Marketing homepage plus product surfaces (Brain, Command Centre, Court, Living Folio / receiving wall, onboarding, Journey). Ask Clive is live on the homepage via `POST /api/ask-clive`. **Chapter 1 Brain Key** routes (`/api/brains/*`) enforce grant-based trusted context access — see [`docs/initiatives/brain-key-wiring.md`](../docs/initiatives/brain-key-wiring.md). Audit booking via Calendly.

## Ask Clive env vars (Vercel)

Add in **Vercel → project → Settings → Environment Variables**:

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes (live replies) | Claude API for replies; empty locally returns the canned fallback |
| `AIRTABLE_READ_TOKEN` | Recommended | Live approved Context Items from base `appYv601Oq7fKTCj0` |
| `CLIVE_MODEL` | No | Override model (default `claude-sonnet-4-6`) |

Copy `website/.env.example` for local dev. Redeploy after adding keys.

### Brain Key env vars (Chapter 1)

| Variable | Required | Purpose |
|----------|----------|---------|
| `BRAIN_KEY_USE_MEMORY` | Local dev | `true` = in-memory grants (no Airtable yet) |
| `BRAIN_KEY_ADMIN_SECRET` | Approve route | Header `x-brain-key-admin` must match |
| `BRAIN_REGISTRY_*` | Production | Registry base + read/admin tokens |
| `BRAIN_WORKSHOP_*` | Production | Workshop draft writes + interaction log |
| `BRAIN_TRUSTED_*` | Production | Per-theme trusted Brain read token |
| `BRAIN_DOC_PROMOTE_TOKEN` | Production | Doc promote route (`x-brain-doc-promote`) |

Run invariant tests: `npm run test:brain-key`

## Platform routes (brain governance)

| Route | Purpose |
|-------|---------|
| `/brain` | Brain shrine — browse seeded/registry brains, name new brains, Enter workspace |
| `/brain/[slug]?tab=` | Per-brain workspace (`overview`, `truths-memories`, `review`, `context-health`, `paper-trail`) |
| `/brain/health` | Redirect → default brain overview tab |
| `/brain/review` | Redirect → default brain review tab (preserves `?view=`) |

Default brain slug: `northline-field-ops`. Full build spec: [`docs/initiatives/brain-shrine-build-plan.md`](../docs/initiatives/brain-shrine-build-plan.md).

## Deploy

Push to the connected Vercel project. Vercel runs `next build` and serves the App Router app, including API routes. Do not look for a static `out/` directory.

Neon (`DATABASE_URL`) and Blob tokens are optional for a basic local preview; they are required for context-index sync and media/onboarding uploads. Full variable list: `website/.env.example`.
