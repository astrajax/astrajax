# AstraJax website

Next.js 15 App Router app (React 19). Marketing shell, Chapter 1 Brain Key, Receiving Wall, onboarding, and platform telemetry routes. Deploy on **Vercel** — not a static export (API routes require a Node runtime).

Copy uses canonical claims from `docs/business/positioning.md`. Ask Clive reads approved Context Items from Airtable (bundled fallback if the token is missing). **Chapter 1 Brain Key** routes (`/api/brains/*`) enforce grant-based trusted context access — see [`docs/initiatives/brain-key-wiring.md`](../docs/initiatives/brain-key-wiring.md).

## Local preview

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000. Copy `website/.env.example` → `.env.local` if missing (startup may do this). Default `BRAIN_KEY_USE_MEMORY=true` runs Brain Key offline without Airtable.

## Static checks / tests

```bash
npx tsc --noEmit
npm run test:brain-key
npm run test:command-centre
npm run test:platform-activity
```

`npm run lint` is not usable non-interactively (no ESLint config). Prefer `tsc` above.

## Ask Clive env vars (Vercel)

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes (live replies) | Claude API; empty → canned `fallback: true` 200 |
| `AIRTABLE_READ_TOKEN` | Recommended | Live approved Context Items |
| `CLIVE_MODEL` | No | Override model (default `claude-sonnet-4-6`) |

### Brain Key env vars (Chapter 1)

| Variable | Required | Purpose |
|----------|----------|---------|
| `BRAIN_KEY_USE_MEMORY` | Local dev | `true` = in-memory grants (no Airtable) |
| `BRAIN_KEY_ADMIN_SECRET` | Approve route | Header `x-brain-key-admin` must match |
| `BRAIN_REGISTRY_*` | Production | Registry base + read/admin tokens |
| `BRAIN_WORKSHOP_WRITE_TOKEN` | Production writes | Drafts, Receiving Wall Accept, onboarding Source Documents |
| `BRAIN_WORKSHOP_READ_TOKEN` | Production reads | Workbench / wall. **Empty or whitespace = unset** — falls back to write, then `BRAIN_DOC_PROMOTE_TOKEN` |
| `BRAIN_TRUSTED_*` | Production | Per-theme trusted Brain read token |
| `BRAIN_DOC_PROMOTE_TOKEN` | Production | Doc promote route (`x-brain-doc-promote`) |

Ops pitfalls (grant restore, promote revoke pagination, draft-write cache): [`brain-key-wiring.md` § Troubleshooting](../docs/initiatives/brain-key-wiring.md#troubleshooting--developer-pitfalls).

## Platform routes (brain governance)

| Route | Purpose |
|-------|---------|
| `/brain` | Brain shrine — browse brains, Enter workspace |
| `/brain/[slug]?tab=` | Per-brain workspace (`overview`, `truths-memories`, `review`, `context-health`, `paper-trail`) |
| `/brain/health` | Redirect → default brain overview tab |
| `/brain/review` | Redirect → default brain review tab (preserves `?view=`) |

Default brain slug: `northline-field-ops`. Full build spec: [`docs/initiatives/brain-shrine-build-plan.md`](../docs/initiatives/brain-shrine-build-plan.md).

## Related docs

- Blob / furniture: [`docs/website-blob-store.md`](./docs/website-blob-store.md)
- Platform telemetry flip: [`docs/platform-telemetry-flip.md`](./docs/platform-telemetry-flip.md)
- Onboarding → Source Documents: [`docs/initiatives/source-document-mining.md`](../docs/initiatives/source-document-mining.md)
