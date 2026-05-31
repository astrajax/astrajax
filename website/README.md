# AstraJax website shell

V1 marketing site built from Taralee's architecture mockups and `astrajax_positioning.md`. Static export — deploy anywhere that hosts HTML.

## What's in the shell

Single-page site with sections:

- Hero + illustrative OS panel (Product-systems direction)
- Founder proof (Founder-led direction)
- Problem, Method, Proof, Adoption, Offers
- Clive section with **Ask Clive placeholder**
- Audit CTA close

Copy uses canonical claims only. Ask Clive and booking are placeholders for the next pass.

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

## Next steps

1. Replace `mailto:hello@astrajax.com` with Calendly or a form
2. Wire Ask Clive to a live agent endpoint
3. Add favicon and OG image
4. Point custom domain at your host

Not designed for Framer import — this is an owned codebase. If you stay on Framer, use this as the section/copy reference while rebuilding visually there.
