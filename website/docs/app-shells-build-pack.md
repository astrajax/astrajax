# App Shells — Build Pack v0.1 ("The World In Its Own Frame")

**Status:** Proposed — this document's PR is the review surface; Matthew's merge locks it.
**Owner:** Kate (scenic workshop). **Approver:** Matthew. **Visual finish authority:** Kathryn / Tara-Lee.
**Evidence base:** `main` @ `b808a90`, scout-verified 8 Jul 2026 (app dir + public dir listings, layout.tsx, plus the T1/W-series ground truth of 7 Jul). Key findings: `app/icon.png` + `app/apple-icon.png` exist (same 87KB asset — favicon-grade); **no web manifest exists**; no viewport/appleWebApp config in layout; `public/app-icons/` namespace is free.
**Origin thread:** `cmra4ubsh03m607adg3bwh0bz`.

## Purpose

Put AstraJax on test users' machines as an installed app, so the painted world lives in **its own frame** — no browser furniture — and Clive's face sits in their dock every day. Driver: first test cohort, maximum habitual use. Presence is the lever an installed shell actually pulls; the weekly *reason to return* remains Clive's job, not the shell's.

Two workstreams, cheapest-first: **S1 PWA** (installable today, all platforms including iPhone) and **S2 Tauri desktop shell** (real `.app` identity, macOS-first). Both frame the **live site** — the server never leaves Vercel.

## Scope

- S1: web manifest, install-grade icons, standalone-mode dressing, an `/install` page.
- S2: a Tauri shell around `https://astrajax.com`, built in CI, signed for macOS.

**Out of scope:** bundling the server or any secret into a shell (breaks the governed-context boundary — the propose/approve model depends on clients not holding keys; permanently out, not deferred); service worker / offline (see D2); push notifications (later, register-sensitive); Windows/Linux native shells (PWA covers them, D7); app stores (D8); tray-companion "Clive in the dock" mini-window (a future S3 — this pack ships the shells, not the companion).

## Locked decisions

- **D1 — Every shell frames the live site.** APIs, keys, and the trust boundary stay on Vercel. A shell is presentation; the server is the product.
- **D2 — No service worker in v1.** Chromium install no longer requires one; Safari never did. An SW's only near-term value is offline caching, and stale-cache bugs against ~150MB of painted media are a worse failure mode than "needs internet" — this product needs internet anyway (D1). Revisit only if an offline booth shell is ever wanted.
- **D3 — Manifest via `app/manifest.ts`** (typed `MetadataRoute.Manifest`, auto-linked by Next — no layout edit needed for it): `display: "standalone"`, `start_url: "/"`, `background_color` Deep Moss `#202A1B`, `theme_color` Deep Moss (recommendation — open call 3). Name fields per open call 1.
- **D4 — Icons are new, properly-sized PNGs** in `public/app-icons/`: 192, 512, and 512-maskable (padded safe zone), plus a reconsidered 180 `apple-icon.png` if the icon direction changes. Kate produces candidate sets (two directions: Clive-portrait crop vs AstraJax logo mark); **binaries reach the branch via Matthew's web-UI upload** (MCP write path is text-only — established constraint), sha-verified after.
- **D5 — Standalone dressing lives in a NEW file** `src/app/app-shell.css`, imported in `layout.tsx` after `globals.css`. Contents: `@media (display-mode: standalone)` hooks, `env(safe-area-inset-*)` padding, and nothing else. **Pack law, learned the hard way (four tail collisions on 7 Jul): no shell CSS ever touches the `globals.css` tail.** This pack is the first demonstration of the per-feature stylesheet pattern.
- **D6 — `/install` page** with per-platform instructions in register (Chrome/Edge address-bar install; macOS Safari File → Add to Dock; iPhone Share → Add to Home Screen), a `beforeinstallprompt`-powered install button where the browser offers it, hidden when already running standalone. Linked from the footer. Copy is register work (Kate drafts, Matthew approves — it's public-facing words).
- **D7 — S2 targets macOS only in v1.** Windows/Linux test users install the PWA (Chromium's install is first-class there). Windows code-signing costs real money and admin for near-zero cohort value now.
- **D8 — Distribution is a direct `.dmg` download** from the `/install` page once signed. No Mac App Store (thin-wrapper rejection risk, review latency — not worth it for a test cohort).
- **D9 — S2 builds in GitHub Actions** (`macos-14` runner): the sandbox cannot compile macOS binaries — CI is the build machine, honestly stated. Unsigned dev artifact first (Matthew right-click-opens to test); signing + notarization wired second, once Matthew's Apple Developer membership and certificate exist. **Signing secrets enter GitHub as repo secrets — that is a credential grant, Matthew performs it** (instructions supplied; never in code).
- **D10 — No auto-updater in v1.** The shell frames the live site, so content is always current; the shell itself should rarely change. Updater = more signing infra for no cohort value.

## Workstreams

### S1 — PWA: installable everywhere (one PR)

**Files owned:** `src/app/manifest.ts` (new), `src/app/app-shell.css` (new), `src/app/layout.tsx` (viewport export: `themeColor`, `viewportFit: "cover"`; `appleWebApp` metadata; the one-line css import), `src/app/install/page.tsx` (new) + a small `InstallPrompt` client component, footer link, `public/app-icons/*` (Matthew-uploaded).
**Lanes:** all Kate — one braided session of config, register copy, and CSS craft; below the size where worker dispatch pays for its own coordination.
**DoD:** Lighthouse installability passes; installs verified on Chrome/Edge desktop, macOS Safari Add to Dock, iPhone Add to Home Screen; standalone launch shows no browser chrome and respects notch safe-areas; site behaviour for ordinary visitors byte-identical (purely additive); icons render crisp at dock/home-screen sizes.

### S2 — Tauri desktop shell: the gilt frame (two PRs)

**S2a (scaffold + CI):** new top-level `desktop/` — Tauri config pointing at `https://astrajax.com`, frameless window with inset traffic lights, sensible default size (1440×900, min 1100×700), external links open in the system browser, `.dmg` bundle target. GitHub Actions workflow producing an unsigned artifact on demand.
**Lanes:** worker (haiku) drafts `tauri.conf.json` + the Actions YAML from verbatim specs in the S2a PR; Kate writes the (tiny) Rust shell, reviews every line, commits.
**S2b (signing):** after Matthew's cert exists — signing + notarization steps in the workflow, Gatekeeper-clean `.dmg`, download link added to `/install`.
**DoD:** unsigned artifact runs on Matthew's Mac and frames the live site cleanly (S2a); signed `.dmg` opens with zero Gatekeeper friction and the app survives quit/relaunch with window state (S2b).

## Sequencing

1. **This pack PR** — merge locks it.
2. **S1 PR** (one session) — icons candidate sets delivered to the thread in parallel; Matthew uploads chosen set to the branch; merge → every test user can install same-day.
3. **Matthew, today, in parallel:** start Apple Developer enrolment (~$99/yr; verification can take days — it's the long pole of S2b).
4. **S2a PR** (one session) — unsigned artifact for his Mac.
5. **S2b PR** (short session, gated on cert) — signed `.dmg`, `/install` updated.

## Matthew's actions

1. Merge this pack.
2. S1: choose icon direction + app display name (open calls 1–2), upload the PNG set to the S1 branch when pinged (~2 min), merge the PR.
3. Start Apple Developer enrolment **today**.
4. S2b: create the Developer ID certificate + add the signing secrets to GitHub (guided, ~1 hour).
5. Hand the `/install` link to the test cohort and watch the dock icons appear.

## Open calls (Matthew arbitrates; Kathryn/TL finish)

1. **The app's name under the icon** — "AstraJax" (the company) vs "Clive" (the character they'll talk to daily). Genuine product question: the dock icon is adoption infrastructure, and "Clive" is the warmer daily-driver name — but it narrows the app to him. Kate recommends: **short_name "AstraJax"** now, revisit when the tray companion (S3) exists to carry the "Clive" identity.
2. **Icon direction** — Clive-portrait crop vs logo mark. Candidate sets supplied with the S1 PR; canon-adjacent, so Kathryn/TL eyes before Matthew's approval.
3. **Theme colour** — Deep Moss `#202A1B` (recommended: matches the painted rooms and reads premium in a title bar) vs Pale Cream surface.
4. **Footer link copy** for `/install` — drafted in the PR for approval ("Keep the study on your desk" register).

## Governance

Green/Amber throughout: working branches, additive presentation-layer changes, feature reachable only via `/install`. Two consciously-gated items, named per house rule: **(a)** Apple Developer enrolment + signing certificate are Matthew-held credentials (S2b cannot start without them; nothing blocks S1); **(b)** GitHub repo secrets for CI signing are a credential grant Matthew performs himself. No canon, no schedules, no secrets in code — and no shell ever holds an API key (D1 is the thesis wearing a build pack).
