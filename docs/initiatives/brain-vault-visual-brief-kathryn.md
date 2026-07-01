# Brain Vault — Visual Brief for Kathryn Goodchild

**For:** Kathryn Goodchild (Kate)  
**From:** Matthew  
**Audience:** TL execution · Veo / still generation · Chapter 1 ambient art  
**Status:** Ready for creative execution  
**Date:** 30 Jun 2026  

**Companion docs (read before executing):**

- `docs/business/brand-colours.md` — cream vs night mode
- `docs/initiatives/command-centre-visual-brief.md` — existing cast room feels
- `docs/initiatives/brain-vault-veo-prompts.md` — motion prompts and vat colour keys (engineering handoff)
- `website/src/lib/clive/room-scripts.ts` — narrative captions per act
- `docs/initiatives/chapter1-context-structure.md` — five brain themes

Matthew owns story and system. TL owns visual representation. Kate decides final art.

---

## At a glance

| | |
|---|---|
| **What this is** | The **Brain Vault** — Chapter 1 Act 2 chamber where business brains live as governed context |
| **Five-second feel** | Clive's library walked downstairs: Victorian, painterly, serious custody — not sci-fi, not horror |
| **Core line** | Five vats. You light just one. |
| **Surface mode** | **Night mode** (Deep Moss) — this is below-the-surface ops theatre |
| **Priority 1** | Wide vault still + five vat loop clips (colour variants only) |
| **Priority 2** | Curation bench still (inside chosen vat) + trusted-seal still (Doc act) |
| **Design principle** | Restraint beats spectacle — the room must sell "pick one domain", not "power up everything" |

---

## 1. What the room must communicate

The Brain Vault is not a generic "AI brain" graphic. It is the visual metaphor for **governed context**:

1. **Brains are domains** — five corners of the business (Core, New Business, Product, Money & Runway, People), not one mushy mega-brain.
2. **Draft vs trusted** — glowing but **contained** under glass; nothing official until a human approves.
3. **Restraint** — Pam's whole beat is: do not light all five at once. The art must show **one vat ready to choose**, the others present but subdued.

Clive's caption for this act:

> **Five vats. You light just one.**

---

## 2. Where it sits in Chapter 1

| Act | Step | Room beat | Asset need |
|-----|------|-----------|------------|
| 1 | `user_brain` | Second chair in **Clive's study** — not the vault | Use existing study art; out of scope here |
| 2 | `brains_intro` | **Brain Vault** — choose a theme | Wide vault still + five vat loops |
| 3 | `business_brain` | **Inside the vat** — curation bench | Bench still (messy → structured) |
| 4 | `pam_challenge` | Pam's chamber | Existing Pam map-desk loop |
| 5 | `human_decision` | Decision moment | UI-led; vault can dim in background |
| 6 | `doc_handoff` | Trusted vat **seals** | Seal / promote still |
| 7–8 | `context_access`, `receipts` | Keys + payoff | UI-led; optional vault glow in receipt card |

This brief covers **Acts 2, 3, and 6** artwork only.

---

## 3. Relationship to existing cast rooms

The vault must feel like the **same oil-painting universe** as the founding cast, but a different **job** in the house.

| Room | Feel | Job |
|------|------|-----|
| **Clive's study** | Warm lamp, fire, second chair, reasoning together | Think |
| **Brain Vault** | Cooler cellar, brass + glass, contained glow | Choose and hold domain context |
| **Curation bench** (inside vat) | Tighter work surface, papers, labels | Draft structured context |
| **Pam's desk** | Map, globe, challenge from above | Stress-test |
| **Doc's workshop** | Forge, gears, filing | Act after approval |

**Continuity rule:** Same aged varnish, fine brushwork, Victorian-industrial craft as Clive's library portrait and Doc's steampunk workshop. The vault sits **between** Clive (warm) and Doc (operational): institutional, not cosy; not hammer-on-anvil.

Reference assets already in repo:

- Clive study hub: `website/public/agent-cast/clive-wigglesworth/clive-study-hub.png`
- Clive hero: Victorian library portrait (founding cast triptych)
- Pam loop: map desk, brass lamp — `website/public/agent-cast/pam-portiscue/animations/idle-loop.mp4`
- Doc loop: steampunk workbench — `website/public/agent-cast/doc-albright/hero.mp4`

---

## 4. Art treatment (non-negotiables)

| Rule | Detail |
|------|--------|
| Medium | **Oil-on-canvas / framed painting** — matches cast hero portraits |
| Era | Victorian-industrial; brass, riveted copper, glass, gauges |
| Camera | **Locked off.** No pan, push, dolly, handheld |
| Motion (loops) | Extremely subtle: brain pulse, fluid drift, soft light flicker — 3–4 s, loop-safe |
| Tone | Serious custody, slightly awe — **never** body horror, never Matrix green |
| UI | No modern screens or SaaS chrome in the painting — product UI lives in the app layer |

---

## 5. Wide vault composition (Act 2)

### Layout

- **Wide chamber**, viewer at standing height, slight downward angle into the vats.
- **Five identical glass vats** in a shallow arc or straight row — same shape, same brass frame, same brain silhouette.
- **One vat foreground** — slightly larger or nearer (the Architect's imminent choice).
- **Other four subdued** — visibly present, lower luminance, "waiting" — do not blaze all five equally.
- **Depth:** brass pipework, valves, gauges, nameplates receding into Deep Moss shadow.

### Light

- **Warm fire-glow** off-frame on one side (continuity with Clive's study upstairs).
- **Cool vat-glow** from the glass on the other — colour varies per vat (see §6).
- Rich painterly chiaroscuro; deep shadows; no flat illustration look.

### Story hints (environmental, not character comedy)

| Element | Purpose |
|---------|---------|
| **Brass nameplates** | CORE · NEW BUSINESS · PRODUCT · MONEY & RUNWAY · PEOPLE |
| **Feed / tend lines** | Small pipes or labelled valves into each vat — Iris tends them (order, not spectacle) |
| **Gate / checkpoint** | Brass arch, ledger desk, or valve station between vault and "outflow" — Pam guards the gate; she need not appear in every wide still |
| **Iris** | Optional distant caretaker silhouette or gloved-hand detail on a valve — do not upstage the vats |

---

## 6. Five vats — colour system only

**Critical:** Vats differ **only by glow colour and nameplate**. Same glass, same brass, same brain form. Colour is how the operator tells brains apart.

| # | Theme | Brain key | Glow signature | Nameplate |
|---|-------|-----------|----------------|-----------|
| 1 | **Core** | `core-*` | Warm **amber-gold** — steadiest, brightest when selected | CORE |
| 2 | **New Business** | `sales-new-business` | Bright **emerald-green**; faint green trace along outbound pipes | NEW BUSINESS |
| 3 | **Product** | `product` | Cool **cyan-blue**; polished brass, engineered shimmer in fluid | PRODUCT |
| 4 | **Money & Runway** | `money-runway` | **Verdigris-green** over warm copper; slow pulse like a ledger tick | MONEY & RUNWAY |
| 5 | **People** | `people` *(confirm slug before ship)* | Soft **rose-amber**; worn, well-handled brass — warmest, most human | PEOPLE |

When generating **loop clips**, use the base + one variation line in `brain-vault-veo-prompts.md`. Kate owns final colour calibration against brand palette.

---

## 7. Curation bench (Act 3 — inside the vat)

Clive's line:

> In we go — inside the vat you chose. This is the curation bench, where the real work happens.

### Shift in scale

- **Close workbench**, not cathedral wide shot.
- Messy source material (notes, emails, flipchart scraps — **fictional / blurred**, no real client data) being sorted into **labelled trays or brass bins**.
- Visual read: **draft on the bench, not truth on the wall**.
- Same painterly treatment; tighter framing; more paper and brass labels; less vault grandeur.

### Mood

- Active but orderly — beginning to look trustworthy, still clearly **workshop**.
- Optional faint glow from the suspended brain above the bench, out of focus.

---

## 8. Trusted seal (Act 6 — Doc handoff)

Doc's beat: approved brief moves from Workshop vat to Trusted vat; old drafts set aside; paper trail.

### One hero still

- Single vat with visible **sealed mechanism** — brass clamp, wax seal, gauge pinned to "TRUSTED", or vault door latched shut.
- Glow steady, calmer than draft state.
- Mood: **filed, final, auditable** — pairs with Doc's workshop energy without duplicating his forge.

---

## 9. Palette

**Primary surface for vault scenes:** night mode (below the surface).

| Role | Hex | Use |
|------|-----|-----|
| Deep Moss | `#202A1B` | Chamber walls, shadow mass |
| Graphite Ink | `#171A18` | Recessed architecture, floor |
| Parchment Dim | `#E7D1AD` | Highlight edges, readable labels |
| Buttermilk | `#E4D3A3` | Warm fire spill, nameplate catch-light |
| Burnt Apricot | `#D77545` | Sparingly — fire-side warmth only |
| Sage Signal | `#9AA77A` | Optional "approved / trusted" accent on seal state |

Vat glow colours (§6) sit **inside** the glass — they are diegetic light, not UI tokens.

Do **not** use Pale Cream `#F3EDDB` as the vault background — cream is command-centre wall / brochure surface.

---

## 10. Motion spec (loops)

Hand to Veo / video gen using `docs/initiatives/brain-vault-veo-prompts.md`. Kate validates output.

| Rule | Value |
|------|-------|
| Duration | 3–4 seconds |
| Camera | Static |
| Motion | Brain pulses gently; fluid drifts; light flickers softly — **mostly still** |
| Loop | First frame = last frame (no visible cut) |
| Poster | Export frame 0 as `.png` — identical to loop at rest |

**Reduced motion:** app shows poster still only when `prefers-reduced-motion: reduce` — poster must carry the full scene.

---

## 11. Deliverables checklist

### Priority 1 — Act 2 vault

| Asset | Format | Notes |
|-------|--------|-------|
| `brain-vault-wide.png` | PNG, ≥2560px wide | Five vats, one foreground emphasis; master still for UI backdrop |
| `brain-vault-core.mp4` + `.png` | Loop + poster | Amber-gold |
| `brain-vault-new-business.mp4` + `.png` | Loop + poster | Emerald |
| `brain-vault-product.mp4` + `.png` | Loop + poster | Cyan |
| `brain-vault-money-runway.mp4` + `.png` | Loop + poster | Verdigris / copper |
| `brain-vault-people.mp4` + `.png` | Loop + poster | Rose-amber |

**Suggested path:** `website/public/brain-vault/` (mirrors `agent-cast/` convention).

### Priority 2 — Acts 3 & 6

| Asset | Format | Notes |
|-------|--------|-------|
| `brain-vault-curation-bench.png` | PNG | Inside-vat workbench |
| `brain-vault-trusted-seal.png` | PNG | Sealed / promoted state |

### Optional (v1.1)

- Wide vault loop (very slow ambient — all five vats dim except user selection)
- Pam gate detail crop for transition into Act 4

### Export notes for Matthew

- Print-safe PNGs where booth or deck use is possible
- sRGB, no embedded secrets or real client text in painted documents
- File names kebab-case as above for direct repo drop

---

## 12. Avoid list

| Do not | Why |
|--------|-----|
| Sci-fi neon, Matrix green, holographic UI | Reads "generic AI product", not AstraJax governance |
| Five different vat designs | Breaks "one consistent place" |
| All five vats equally bright | Undermines "pick one" |
| Horror / grotesque brain imagery | Wrong tone — these are **their** contexts, not specimens |
| Pam as HR/compliance officer visual | Gate is guarded, not policed |
| Modern laptops, monitors, dashboards in the painting | Keeps theatre in period; app carries UI |
| Childish or mascot energy | Brand rule — serious visuals, playful voice elsewhere |

---

## 13. Copy pairing (for layout, not in the art)

| Act | Caption on rail |
|-----|-----------------|
| 2 | Five vats. You light just one. |
| 3 | From raw notes to structured context. |
| 6 | Approved. Filed. On the record. |

---

## 14. Approval

| Decision | Owner |
|----------|-------|
| Final art, colour grade, composition | Tara-Lee |
| Narrative fidelity, product metaphor | Matthew |
| File drop + UI integration | Doc / Vercel minion after assets land |

**Open item:** confirm `people` brain key slug before nameplate ships to production wiring.

---

## 15. Quick Veo reference (appendix)

Base prompt and per-vat variation lines live in `docs/initiatives/brain-vault-veo-prompts.md`. Kate may adapt wording for still generation tools; keep the locked rules in §4 and §10.
