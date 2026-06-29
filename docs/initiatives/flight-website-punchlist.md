# Flight punch list — website (offline-friendly)

Working branch: `flight/website-work`. Run from `website/`: `npm run dev` → http://localhost:3000

## Tasks (no wifi required)

1. **Hero mobile QA** — `/` at 375px and 390px: picture rail, nav wainscoting, tap targets, no horizontal scroll.
2. **Compress Pam video** — optimise any heavy agent/cast clips under `public/`; keep quality acceptable on mobile.
3. **FeatureHub / homepage copy** — tighten headlines and subcopy; align with `docs/business/positioning.md` (read from repo).
4. **Chapter 1 polish** — `/chapter-1`: spacing, typography, section transitions; match journey/chapter tone.
5. **Agent detail pages** — spot-check `/agents/[slug]` layout and hero on small screens.
6. **Lint + build gate** — `npm run lint`, `npm run build` before you land.
7. **Vitest (local)** — `npm run test:brain-key` for brains/clive unit tests (no network if mocks hold).

## Needs wifi (skip on plane)

- Ask Clive, brain API routes, Airtable promote/mine, Vercel Blob uploads, fresh `npm install` / deploy.
