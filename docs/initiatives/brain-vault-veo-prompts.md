# Brain Vault — Veo prompt pack (Act 2)

**Status:** Creative spec, ready to generate  
**Owner:** Matthew  
**Date:** 30 Jun 2026  
**Purpose:** Generate five short, loop-safe Veo clips for the Act 2 **Brain Vault** —
the steampunk chamber where the operator's business brains live as glowing brains
suspended in glass vats. One reusable base prompt + one variation line per vat.  
**Use with:** Chapter 1 brain themes in
[`chapter1-context-structure.md`](./chapter1-context-structure.md) §3 and the
agent-cast loop convention in
[`../../website/public/agent-cast/INGEST-NOTES-pam-doc.md`](../../website/public/agent-cast/INGEST-NOTES-pam-doc.md).

---

## The five vats

The vault holds one vat per business brain. Themes and brain keys (from the
Chapter 1 context structure):

| # | Vat | Brain key | Glow signature |
|---|-----|-----------|----------------|
| 1 | **Core** | `core-*` | Warm amber-gold — the founding heart of the vault |
| 2 | **New Business** | `sales-new-business` | Bright emerald-green — pursuit and pipeline |
| 3 | **Product** | `product` | Cool cyan-blue — clean, engineered |
| 4 | **Money & Runway** | `money-runway` | Deep verdigris-and-brass — ledger green over copper |
| 5 | **People** | `people` *(suggested)* | Soft rose-amber — warm, human |

> Brain keys for Core, New Business, Product and Money & Runway are the canonical
> Chapter 1 scope slugs. `people` is a suggested slug — "People" is a valid operator
> function but does not yet have a defined template scope area; confirm before wiring.

> Keep each vat visually distinct **by glow colour only**. The vat, glass, brass
> fittings and brain shape stay the same across all five so the chamber reads as one
> consistent place. Colour is how the operator tells the brains apart.

---

## Lessons carried over from the Clive clips

The Clive hero/animation loops taught us what reads well and what breaks the spell:

- **Static, locked-off camera.** No pans, pushes, dollies, or handheld drift.
- **Subtle motion only.** Words like *subtle*, *gentle*, *mostly still*, *slow* in
  every prompt. No exaggerated or fast movement.
- **Loop-safe.** The clip must begin and end on the same still state so it can loop
  without a visible cut.
- **Short.** 3–4 seconds. Long clips drift and stop looping cleanly.
- **One oil-painting world.** Consistent framed-painting / oil-on-canvas treatment so
  the vault matches the rest of the cast.

---

## (a) BASE prompt — reuse for every vat

> Paste this base, then append the single variation line for the vat you are
> generating. Do not add extra motion or camera language.

```text
Oil-painting style, Victorian-industrial brain vault. A large glass vat stands
centre frame, filled with faintly luminous fluid. Suspended inside, a softly
glowing human brain hovers, lit from within. Brass pipes, valves, gauges and
riveted copper fittings frame the vat; a warm fire glows off-frame on one side
while a cool luminous glow rises from the vat on the other. Rich, painterly light,
deep shadows, fine brushwork, aged varnish. Static locked-off camera, no camera
movement. Motion is extremely subtle and slow: the brain pulses gently, the fluid
drifts faintly, light flickers softly. The scene is mostly still. It begins and
ends on the same calm state so it loops seamlessly. 3–4 seconds.
```

---

## (b) Variation line — one per vat

Append exactly one line to the base prompt.

1. **Core** — `The brain glows warm amber-gold, the steadiest and brightest vat; a single brass nameplate beneath reads "CORE".`
2. **New Business** — `The brain glows bright emerald-green; thin green light traces gently along the brass pipes leading out of frame, like a pursued lead.`
3. **Product** — `The brain glows cool cyan-blue, clean and precise; the brass fittings are polished and exact, a faint engineered shimmer in the fluid.`
4. **Money & Runway** — `The brain glows deep verdigris-green over warm copper; a slow, regular pulse like a ledger ticking, brass gauges catching the firelight.`
5. **People** — `The brain glows soft rose-amber, the warmest and most human vat; the surrounding brass is worn and well-handled, light gentle and inviting.`

---

## (c) Poster-still plan & reduced-motion fallback

### Poster stills

Every vat clip needs a matching still for the `<video poster>` attribute and for
the reduced-motion fallback. Grab the **first frame** (the calm start state) so the
poster and the loop's resting state are identical and there is no jump on play.

```bash
# Run per generated clip; swap {vat} for core | new-business | product | money-runway | people
ffmpeg -y -i brain-vault-{vat}.mp4 -vf "select=eq(n\,0)" -vframes 1 brain-vault-{vat}.png
```

Suggested storage (mirrors the agent-cast convention; final home is the code
owner's call):

```text
website/public/brain-vault/
  brain-vault-core.mp4        + brain-vault-core.png
  brain-vault-new-business.mp4 + brain-vault-new-business.png
  brain-vault-product.mp4     + brain-vault-product.png
  brain-vault-money-runway.mp4 + brain-vault-money-runway.png
  brain-vault-people.mp4      + brain-vault-people.png
```

### Reduced-motion fallback

The vault loops are ambient, not informational, so when a user prefers reduced
motion, show the poster still instead of playing the video.

- Honour `prefers-reduced-motion: reduce`: render the `.png` poster, do not autoplay
  the `.mp4`.
- The poster (first frame = resting state) carries the full scene, so nothing is
  lost — the operator still sees the glowing brain in its vat.
- Because every clip already begins and ends on the same still state, a paused
  first frame is indistinguishable from the live loop at rest.
