# TL Onboarding — Interface Extension

Onboarding hub for **Tara Lee (TL)**. HTML modules from **TL Onboarding**; notes, completion, and Q&A in **TL Onboarding Progress**.

**Base:** `appYv601Oq7fKTCj0` · **Block:** `blk9JtMMGag4zzehx` · **Interface page:** `pagdg8ciA7vQswXrs`

Canonical setup: [`../README.md`](../README.md)

## What it does

- Sidebar by section, ★ on essential modules, progress bar
- Per module: **mark complete**, **private notes** (auto-save), **question for Matthew**
- Matthew: **reply** + mark **Answered** (UI permission-gated)
- **Log an idea** → **AI Idea Log** table (optional third table)

## Release

```bash
cd interface-extensions/tl-onboarding
npm install && npm run typecheck
npx block release
```

`.block/remote.json` uses `"baseId": "NONE"`. Optional: `npx block release --remote astrajax`

## Interface setup (two layers)

### 1. Extension properties (cog)

| Property | Table |
|----------|--------|
| TL Onboarding table | `TL Onboarding` |
| TL Onboarding Progress table | `TL Onboarding Progress` |
| AI Idea Log table | `AI Idea Log` (optional — button hidden until set) |

### 2. Interface Designer → extension → **Data**

#### TL Onboarding (`tblSdWUBVWrxpislp`) — read all

| Field | Notes |
|-------|--------|
| Title | |
| Sort Order | |
| Section | |
| Summary | |
| HTML Body | |
| Read Time Min | |
| Essential | |
| Slides PDF | Attachments |
| Slides URL | |
| Video URL | |

#### TL Onboarding Progress (`tblqdV4mNxOUfMEEX`)

| Field | Tara | Matthew |
|-------|------|---------|
| Label | Read | Read |
| Module | Read | Read |
| Completed | **Edit** | Read |
| TL Notes | **Edit** | Read |
| Question for Matthew | **Edit** | Read |
| Question Status | Read | **Edit** |
| Matthew Reply | Read | **Edit** |

#### AI Idea Log (optional) — create from button

| Field | Access |
|-------|--------|
| Idea | **Create** |
| Detail | **Create** |
| Type | **Create** |
| Status | **Create** (defaults New) |
| Source | **Create** |
| Logged By | Read (if populated by automation) |
| Logged At | Read |

Create table: `python3 scripts/seed_tl_onboarding.py --idea-log`

## Seed / content updates

```bash
python3 scripts/seed_tl_onboarding.py              # first seed
python3 scripts/seed_tl_onboarding.py --sync-modules   # push HTML updates
```

Content source: `scripts/tl_onboarding_content.py`

Content source: `scripts/tl_onboarding_content.py` (distilled from `astrajax_positioning.md`, `astrajax_ops_brief.md`, `astrajax_brand_colours.md`).
