# Vercel plugin skills — picker for Doc & Vercel Minion

These skills ship with the **Vercel Cursor plugin** (the pills you see in chat:
Functions, Sandbox, Storage, CLI, Agent, etc.). Some are also vendored under
`.cursor/skills/` (see `skills-lock.json` at repo root). Cursor loads plugin
skills by name when Doc or the Vercel Minion names them.

**Rule:** Doc picks skills in Phase A; Vercel Minion **reads the named skill
files** before Phase B work on that topic. Do not guess Vercel API behaviour when
a skill exists.

Upstream plugin (skills, specialist agents, slash commands):
[vercel/vercel-plugin](https://github.com/vercel/vercel-plugin). Skills are
on-demand — not auto-injected every chat. Specialist agents when useful:
`deployment-expert`, `performance-optimizer`, `ai-architect`.

---

## Vercel auth & project identity (check before deploy / MCP work)

Matthew has **two** Vercel logins. The Cursor Vercel plugin can land on the wrong
one. AstraJax website work must use the **AstraJax** team — not Direct Sales
(Butternut).

| | AstraJax (correct for `website/`) | Wrong account |
|--|-----------------------------------|---------------|
| Team | **AstraJax** (`astra-jax`) | Direct Sales |
| Team ID | `team_sYfTdTAvtNfhoDtc8QUsQSEf` | `team_cyh9S0mA4yZsHaFp4YDCmXvD` |
| Project | **astrajax** | `ds-brains` |
| Project ID | `prj_qpGvaEbXHn4JXu1eDTbNFDJ6kxQQ` | — |
| Root directory | `website/` | — |
| Domains | `astrajax.com`, `www.astrajax.com` | — |

Local link files (gitignored): `website/.vercel/project.json` and repo-root
`.vercel/project.json` should match the AstraJax IDs above.

**Healthy check (Vercel MCP):** `list_teams` shows **AstraJax**; `get_project`
for `astrajax` / the project ID above succeeds.

**Broken check:** only **Direct Sales** / `ds-brains` visible, or AstraJax
project returns **403**. Fix: re-auth the Vercel plugin (`mcp_auth` on
`plugin-vercel-plugin-vercel`) and sign in with the **AstraJax** Vercel
account — not the Butternut / Direct Sales login. Browser auto-pick of the
wrong Google/GitHub account is the usual cause.

Do not store secrets here. IDs and team names only.

---

## AstraJax defaults (most jobs)

| Skill | Use when |
|-------|----------|
| **nextjs** | Almost always — `website/` is Next.js App Router |
| **verification** | After dev server or "does it work?" / debugging |
| **env-vars** | `.env`, Vercel env pull/add, Brain Key token names |
| **vercel-functions** | `/api/*` routes, serverless, streaming, cron |
| **deployments-cicd** | Preview deploy, promote, rollback, CI |
| **vercel-cli** | `vercel link`, logs, domains from terminal |

---

## Full roster (load when the job needs it)

| Skill | Plain English | Typical trigger |
|-------|---------------|-----------------|
| **nextjs** | Pages, routing, RSC, layouts, data fetching | Any `website/` feature |
| **vercel-functions** | API routes, serverless, edge, cron | `/api/brains`, `/api/ask-clive` |
| **env-vars** | Environment variables, sync local ↔ Vercel | New secrets, `.env.example` |
| **deployments-cicd** | Deploy pipeline, previews, production promote | "Deploy", "preview URL" |
| **vercel-cli** | CLI deploy, link, logs, domains | Terminal ops |
| **verification** | End-to-end: browser → API → response | "Why isn't it working?" |
| **ai-sdk** | LLM routes, streaming, tool calling | AI API handlers |
| **ai-gateway** | Multi-provider routing, failover, cost | Gateway config |
| **shadcn** | UI components, theming, Tailwind UI | Initialised in `website/` (`components.json`); in-scope for Chapter 1 UI |
| **react-best-practices** | TSX quality pass after multi-file UI edits | Post-build review |
| **auth** | Clerk / Auth0 / Descope | Auth (AIE demo: **out of scope**) |
| **vercel-storage** | Blob, Edge Config, Postgres, Redis | Persistent storage on Vercel |
| **routing-middleware** | Edge middleware, rewrites, redirects | Request interception |
| **runtime-cache** | Platform cache API | Advanced caching |
| **next-cache-components** | PPR, `use cache`, cache tags | Next 16 cache patterns |
| **turbopack** | Bundler / HMR issues | Build perf debugging |
| **vercel-sandbox** | Isolated microVMs for untrusted code | Sandboxed execution |
| **workflow** | Durable workflows (WDK) | Long-running orchestration |
| **chat-sdk** | Slack/Teams/Discord bots | Chat bots (not AIE v1) |
| **marketplace** | Vercel integrations, Neon, etc. | Third-party Vercel services |
| **bootstrap** | Link repo + env + first-run setup | New machine / broken env |
| **next-upgrade** | Next.js version upgrades | Major Next bump |
| **vercel-firewall** | WAF, DDoS, rate limits | Security hardening |
| **vercel-agent** | Vercel's AI code review / incident tools | Vercel Agent product, not Doc minions |
| **knowledge-update** | Stale Vercel platform facts | Auto at session start |

**Skip for AstraJax `website/` unless asked:** next-forge (monorepo template — we use single `website/` app).

---

## Repo-local UI skills

For UI polish, design direction, or review passes, Doc may also name repo skills
from `.cursor/skills/`:

| Skill | When |
|-------|------|
| **frontend-design** | New pages or major visual direction |
| **emil-design-eng** | Polish, micro-interactions, craft decisions |
| **web-design-guidelines** | UX/a11y audit pass |
| **review-animations** | Motion review after UI changes |
| **vercel-react-best-practices** | Performance pass after multi-file UI edits |

**Plugin ↔ repo mapping:** plugin **react-best-practices** corresponds to repo
**vercel-react-best-practices** (vendored; also always-on via workspace rule).

**shadcn MCP:** a local shadcn MCP may be configured in gitignored
`.cursor/mcp.json` for component installs — not required in repo.

---

## Doc routing add-on (when minion = Vercel)

After naming Vercel Minion, Doc adds:

```text
**Vercel skills for this job:** skill-a, skill-b, skill-c
**Why these:** one short phrase each
**Skipped:** skill-x (not needed because …)
```

Pick **minimum set** — usually 2–5 skills, not the whole plugin.

---

## Minion execution

Before Phase B work on a topic:

1. Read `doc-vercel-minion/references/vercel-plugin-skills.md` (this file) if unsure.
2. **Read** each named Vercel plugin skill (`SKILL.md`) — Cursor resolves plugin skills by name when listed in the session; prefer explicit Read if behaviour is safety-critical (env, deploy, auth).
3. Follow that skill's guidance for the implementation step.
4. Run **verification** after non-trivial Phase B when a dev server or deploy exists.

Plugin skill paths (local install, may vary by machine):

`~/.cursor/plugins/cache/vercel/vercel-plugin/*/skills/<skill-name>/SKILL.md`

Do not duplicate plugin skills into the repo unless already vendored in
`.cursor/skills/` (see `skills-lock.json`) — keep plugin updates automatic.
