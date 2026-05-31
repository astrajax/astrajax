# AstraJax website shell

V1 marketing site built from Taralee's architecture mockups and `astrajax_positioning.md`. Static export — deploy anywhere that hosts HTML.

## What's in the shell

Single-page site with sections:

- Hero + illustrative OS panel (Product-systems direction)
- Founder proof (Founder-led direction)
- Problem, Method, Proof, Adoption, Offers
- Clive section with **live Ask Clive** (server-side `/api/ask-clive`)
- Audit CTA close

Copy uses canonical claims only. Ask Clive reads approved Context Items from Airtable (fallback bundled context if the token is missing). Audit booking via Calendly.

## Local preview

```bash
cd website
npm install
npm run dev
```

Open http://localhost:3000

## Build static files (for upload)

```bash
npm run build
```

Output lands in `website/out/` — a folder of HTML, CSS, and JS you can upload to:

- **Vercel** — connect the repo or drag-drop `out/` (or push and let Vercel build)
- **Netlify** — deploy `out/` as publish directory
- **Cloudflare Pages** — same
- **Any static host** — upload the contents of `out/`

## Ask Clive env vars (Vercel)

Add in **Vercel → astrajax → Settings → Environment Variables**:

| Variable | Required | Purpose |
|----------|----------|---------|
| `ANTHROPIC_API_KEY` | Yes | Claude API for replies |
| `AIRTABLE_READ_TOKEN` | Recommended | Live approved Context Items from base `appYv601Oq7fKTCj0` |
| `CLIVE_MODEL` | No | Override model (default `claude-sonnet-4-6`) |

Copy `website/.env.example` for local dev. Redeploy after adding keys.

## Next steps

1. Add `ANTHROPIC_API_KEY` (+ `AIRTABLE_READ_TOKEN`) in Vercel and redeploy
2. Add favicon and OG image

Not designed for Framer import — this is an owned codebase. If you stay on Framer, use this as the section/copy reference while rebuilding visually there.
