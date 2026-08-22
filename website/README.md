# AstraJax website shell

V1 marketing site built from Taralee's architecture mockups and `docs/business/positioning.md`. This is a Next.js App Router app (Next 16, React 19) with next-auth, Neon, Vercel Blob, and API routes. Not a static export.

## What's in the shell

Single-page site with sections:

- Hero + illustrative OS panel (Product-systems direction)
- Founder proof (Founder-led direction)
- Problem, Method, Proof, Adoption, Offers
- Clive section with **live Ask Clive** (server-side `/api/ask-clive`)
- Audit CTA close

Copy uses canonical claims only. Ask Clive reads approved Context Items from Airtable (fallback bundled context if the token is missing). **Chapter 1 Brain Key** routes (`/api/brains/*`) enforce grant-based trusted context access — see [`docs/initiatives/brain-key-wiring.md`](../docs/initiatives/brain-key-wiring.md). Audit booking via Calendly.

## Local preview

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000

## Build

```bash
npm run build
npm start
```

This is a Node server (`next start`), not a static `out/` folder. Deploy on Vercel from `website/` so API routes, next-auth, Neon, and cron can run. Tests: `npm test` (vitest) and `npm run test:e2e` (playwright).

## Ask Clive env vars (Vercel)

Add in **Vercel → astrajax → Settings → Environment Variables**:

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API for replies |
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

## Next steps

1. Add `ANTHROPIC_API_KEY` (+ `AIRTABLE_READ_TOKEN`) in Vercel and redeploy
2. Add favicon and OG image

This is an owned Next.js codebase, not a Framer export.
