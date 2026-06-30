# Command Centre — Visual Brief (Kathryn Goodchild)

**Owner:** Matthew · **Audience:** Doc Vercel Minion build · **Status:** approved for implementation  
**Companion:** `docs/business/brand-colours.md`, `docs/initiatives/tara-lee-visual-brief.md`

---

## Five-second feel

You step into a lit Victorian command centre. Three portraits on cream paper invite you in. Click one and the frame widens until you are inside that character's moss-dark room — not a SaaS dashboard, a place.

| Room | Feel in five seconds |
|------|----------------------|
| **Command centre (wall)** | Editorial calm, cream paper, gold frames, living portraits — "choose who you need" |
| **Clive's study** | Warm lamp, shelves, reasoning partner — "think here" |
| **Doc's workshop** | Workbench, blueprints, operational — "build after approval" |
| **Pam's desk** | Chart table, compass, raised eyebrow — "what looks stale or wrong?" |

---

## Surface modes

| Surface | Palette | Share |
|---------|---------|-------|
| Command centre wall | Pale Cream `#F3EDDB`, Ink `#23271B`, Terracotta `#A95A2E` CTAs | 70–80% cream |
| Character rooms (deep dive) | Deep Moss `#202A1B`, Parchment `#E7D1AD`, Graphite `#171A18` chrome | 65–75% dark |

Cream invites; moss immerses. Do not put Deep Moss on the public wall.

---

## Character accents (one per room)

| Character | Accent | Use |
|-----------|--------|-----|
| Clive | Burnt Apricot `#D77545` | Annotations, station hover, lamp warmth |
| Doc | Sage Signal `#9AA77A` | Live badges, workbench highlights |
| Pam | Terracotta `#A95A2E` | Challenge cues, review queue emphasis |

Pam must not read as HR or villain. Sharp silhouette, warm eyes.

---

## Door / widen motion

- Duration: **900ms** (match existing `portrait-entry--leaving`)
- Easing: ease on opacity; scale to **1.06** on exit
- View Transitions API when supported; CSS fallback otherwise
- `prefers-reduced-motion`: instant cut, no scale
- Focus: move to room heading on entry; restore on exit to portrait

---

## Typography

Keep **Inter** for v1. Display weight via `font-display` (semibold headlines). No new webfont until TL approves a serif for carved wordmark parity.

---

## Pam test

Pam's room shows brain health and review queue. Copy frames her as challenger ("this looks stale — stress-test before you fix it"), not compliance officer. Clive's Man stewardship appears in paper-trail copy, not as a fourth portrait on the wall.

---

## Story modes

| Mode | UI (v1) |
|------|---------|
| Full Story | Clickable portrait doors (default) |
| Light / No Story | Decorative portraits; `#platform` FeatureHub card directory |

**v1.1 note:** Light and No story currently share the same behaviour (portrait doors off, card directory on). Planned split — not yet built:

| Mode | Portrait doors | Theatre (planned) |
|------|----------------|-------------------|
| Light | Off | Decorative looping video + role captions; command-centre hint visible |
| No story | Off | Static posters only; strip hint copy and role captions for a flat commercial surface |

Toggle lives in the nav only (desktop compact + mobile drawer). Do not duplicate in FeatureHub.

---

## Design test

A commercial leader glances at the homepage and knows: Clive thinks, Pam challenges context, Doc builds — without reading a card grid.
