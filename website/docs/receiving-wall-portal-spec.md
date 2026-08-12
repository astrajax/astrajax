# The Receiving Wall — Portal Spec v0.1

**Surface:** `/man/receiving-wall` — Clive's Man's context-intake landing page.
**Author:** Kate (scenic workshop). **Approver:** Matthew. **Visual finish authority:** Kathryn / Tara-Lee.
**Status:** Design direction, unbuilt. This document is the build instruction; a Composer
agent implements it literally. No application code was written in producing it.
**Cites:** `website/docs/chapter1-craft-build-pack.md` (drift controls, governance, house craft kit).

## What this fixes

Matthew, on the current build:

> "it looks like the text is just digital text over a painting. We need it to look like we're
> looking into a portal." … "When we zoom in, it stops zooming too quickly and we lose any of the
> left or right sides." … "The arches begin to fade out and are replaced by the other images. I
> think we actually don't need the second image and we just hold zoomed in."

Three separate faults, and it matters that they're separate:

1. **Framing.** `scale(1.49)` at origin `50% 46%` lands the camera *inside* the dark void. Measured
   below: at 1.49 the viewport shows source x 16.4%–83.6%, and the arch's inner edges are at
   19.0%/81.0%. Two ~2.5%-wide slivers of moulding survive at the extreme edges. The arch has
   stopped being a frame.
2. **Surface.** Even when the geometry is right, the type is a separate compositing layer: same
   brightness everywhere, hairline `border-bottom` rules running the full content width, a
   `0 2px 10px` drop-shadow that no incised letter has ever cast. Nothing binds the type to the paint.
3. **The move.** One 900ms `cubic-bezier(0.45, 0, 0.16, 1)` transition that arrives at a dead stop,
   and a crossfade layer that 404s.

**Direction confirmed:** I agree with the reading in the brief. The fix is *less* camera, not more —
land where the arch still frames the content, constrain the content to the arch's actual opening,
and put one grade layer over everything so type and paint share the same tooth. Matthew's third
note ("we don't need the second image") is correct and is now mandatory rather than optional: the
`.stageZoomed` asset does not exist, so that layer is dead code today.

**Verification status.** All geometry in §0 is measured from the shipped poster frame
(`receiving-wall-poster.jpg`, 1920×1080) with a pixel scan, not eyeballed. Everything in §1, §2, §4
and §5 follows deterministically from that. §3 (surface treatment) and §6 (Clive entry points) are
craft proposals I cannot fully judge without seeing them rendered — each carries an explicit
fallback and is flagged for Kathryn / Tara-Lee's eye.

> **Amendment (Matthew, Aug 2026 — pinned arch + travelling interior).** Three layers on `.plate`
> (which carries the dolly camera push, default `--dolly-in-16-9: 1.22`):
> 1. **Interior** (`.bayTravel`) — poster + bay type; translates on reading scroll.
> 2. **Room frame** (`.roomStatic`) — poster with SVG **luminance** hole (`roomStaticMaskUrl`,
>    `mask-mode: luminance`; hole bottom = `APERTURE.holeBottomY` **0.88**, under the sill belt
>    so the hard hole edge is hidden). Never use `clip-path: path()` with 0–1 coords (browsers
>    treat those as px). Arch, sconces, wood stay put while the interior travels.
> 3. **Sill belt** (`.sillForeground`) — cut master pixels for the ledge + letter/quill
>    (`receiving-wall-sill.png`, top at 85% of the plate), pinned above the hole edge so props
>    stay whole.
> Idle ledger scroll is unchanged (paint still; category list scrolls in the aperture).

---

## §0 — Measured geometry of the painting (the scene manifest)

The painting is 1920×1080 (16:9). All figures below are **fractions of the source frame**, measured
by luminance-edge scan of the poster. Treat this table as the manifest; every number in §1 and §2
derives from it. It belongs in code as a typed data module, per house convention (see
`lib/chapter1/hub-manifest.ts` for the pattern) — see §7 for the file.

| Feature | Source x | Source y |
|---|---|---|
| Arch aperture, left inner edge (straight leg) | **19.0%** | below 30% |
| Arch aperture, right inner edge (straight leg) | **81.0%** | below 30% |
| Stone moulding band, left | 16.7% → 19.0% | — |
| Stone moulding band, right | 81.0% → 83.3% | — |
| Lit plaster wall, left | 11.5% → 16.7% | — |
| Lit plaster wall, right | 83.3% → 88.0% | — |
| Left candle flame | **10.4%** | 34.4% |
| Right candle flame | **89.5%** | 34.4% |
| Arch crown apex (inner) | 50.0% | **8.15%** |
| Void bottom / stone ledge top | — | **≈89.5%** |
| Ledge still-life (sealed letter + quill) | 27% → 44% | 87% → 93% |

**The arch curve** (inner edge y, by column — this is what a rectangular content box must clear):

| x | 19% | 20% | 22% | 24% | 26% | 28% | 30% | 34% | 38% | 42% | 46% | 50% |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| **y** | 29.5% | 23.9% | 19.7% | **18.4%** | 17.1% | 15.7% | 14.5% | 12.3% | 10.7% | 9.4% | 8.5% | 8.15% |

Symmetric about 50% (measured: 76% → 18.0%, 80% → 23.9%, 81% → 30.2%).

**Derived safe box** — the largest rectangle that sits inside the aperture with real clearance:

```
SAFE BOX:  x 24% → 76%   (52% of plate width)
           y 22% → 86%   (64% of plate height)
```

At x = 24% the arch is at 18.4%, so a 22% top gives 3.6 percentage points of clearance; the 86%
bottom sits 3.5pp above the ledge. This is the box all content lives in. Nothing may cross it.

**Palette sampled from the paint** (use these, not invented values):

| Sample | Hex |
|---|---|
| Void, just inside the left inner edge | `#161712` |
| Void, centre (mid height) | `#3b4039` |
| Void, bloom peak (50%, 76%) | `#677367` |
| Void, under the crown (50%, 13%) | `#22211d` |
| Moulding shadow / catch, left | `#54442d` / `#716147` |
| Moulding shadow / catch, right | `#5d4c38` / `#6d5f44` |
| Lit plaster, left / right | `#c7a577` / `#c7a276` |
| Frame top edge, mean | `#352e22` |
| Frame bottom edge, mean | `#2e251b` |

Note the void is **not** flat: it runs `#22211d` under the crown to `#677367` at the bloom, and the
inner edges are markedly darker than the centre. That vertical fall is the single strongest depth
cue in the plate and every treatment below is built to work *with* it, not paint over it.

---

## §1 — The portal

### 1.1 Stop treating the video as a background. Build a plate.

The current `.stage` is `position: fixed; inset: 0` with `object-fit: cover` on the video. That means
**the framing changes with viewport aspect before the transform even runs**, so no fixed
`transform`/`origin` pair can be trusted. On a 16:10 window the cover crop already removes 5% of the
source from each side; on a 2.08 window it removes 7% from top and bottom. This is why the settled
state looks different on every machine.

Replace it with an explicit **plate**: a real box of known aspect, so its rect is computable and the
aperture's on-screen position is knowable.

```html
<div class="stage" aria-hidden>          <!-- fixed, clips -->
  <div class="plate">                    <!-- the camera: dolly transform lives here -->
    <div class="plateBreath">            <!-- the perpetual slow drift, §4.3 -->
      <video class="stageVideo" …></video>
      <div class="plateRecess"></div>    <!-- aperture-shaped inner shadow -->
    </div>
    <div class="plateSkirt"></div>       <!-- nave mode only, §2.4 -->
  </div>
</div>
```

```css
.stage {
  position: fixed;
  inset: 0;
  z-index: 0;
  overflow: hidden;          /* the plate is wider than the viewport — clip HERE, not on .wall */
}

.plate {
  position: absolute;
  left: 50%;
  top: 50%;
  width: var(--plate-w);
  aspect-ratio: 16 / 9;
  transform:
    translate(-50%, -50%)
    translateY(var(--dolly-y))
    scale(var(--dolly));
  transform-origin: 50% 50%;
  transition: transform var(--dolly-ms) var(--dolly-ease);
  will-change: transform;
}

.plateBreath { position: absolute; inset: 0; }
.stageVideo  { width: 100%; height: 100%; object-fit: fill; display: block; }
```

`object-fit: fill` is correct here and not a bug: the plate's aspect ratio already equals the video's,
so `fill` and `cover` are identical and `fill` avoids a second implicit crop.

Transform order note for the implementer: functions apply right-to-left, so the element is scaled
about its own centre first, then shifted by `--dolly-y` in **unscaled screen pixels**, then centred.
`--dolly-y` is therefore a plain "move the framing down the screen by N vh" control, which is what
you want.

**`--plate-w` reproduces `cover` exactly, as a measurable box:**

```css
--plate-w: max(100vw, calc(100svh * 16 / 9));
```

Use `svh`, not `vh` — the mobile URL bar must not resize the plate mid-scroll.

### 1.2 The settled dolly: 1.38 at 16:9 — "standing in the opening"

> **Amendment (Matthew, Aug 2026).** Kate's original §1.2 optimised for *the arch frames the
> content* — visible source-x 10%–90%, candles and lit plaster inside frame, moulding legs as
> frame around content. **Matthew overruled:** the intent is *standing in the opening* — mouldings
> hard at the frame edges, bookshelves and candle sconces out of frame. Settled framing at 16:9 is
> now **source-x 13.8% → 86.2%** (equivalent to the old `scale(1.38)` under the pre-plate
> architecture, commit `0fa9c60`). The candles are **deliberately out of frame** by choice.

**Target framing at rest-in-portal: the viewport shows source x 13.8% → 86.2% at 16:9.** Stone
moulding legs sit at or very near the left and right frame edges; lit plaster and bookshelves are
cropped out. This is the inverse of Kate's original pass/fail test (§7).

Because visible-x fraction = `100vw / (--plate-w × --dolly)`, and `--plate-w` depends on viewport
aspect, `--dolly` must be bucketed by aspect. CSS cannot divide a length by a length, so this is
media queries, not calc. Target visible-x fraction = **0.7246** (13.8%–86.2%). Four buckets, ordered
so later rules win; **add `min-aspect-ratio: 16/9`** so exactly 16:9 gets 1.38 (otherwise
`max-aspect-ratio: 16/9` would apply at equality and undershoot):

```css
.wall {                                    /* default = ultrawide */
  --dolly-in: 1.38;
  --dolly-in-y: 2.5vh;
}
@media (max-aspect-ratio: 16/9) {   .wall { --dolly-in: 1.24; --dolly-in-y: 2.5vh; } }
@media (min-aspect-ratio: 16/9) {   .wall { --dolly-in: 1.38; } }   /* 16:9 equality — Matthew's framing */
@media (max-aspect-ratio: 3/2)   {  .wall { --dolly-in: 1.04; --dolly-in-y: 3vh;   } }
@media (max-aspect-ratio: 6/5)   {  .wall { --dolly-in: 1.00; --dolly-in-y: 0;     } }  /* nave mode, §2.4 */
```

Resulting framing (verified arithmetic, target visible-x = 0.7246):

| Viewport aspect | `--dolly-in` | Visible source-x | Moulding legs at edges | Candles | Crown |
|---|---|---|---|---|---|
| 2.10 (ultrawide) | 1.38 | 13.8% – 86.2% | ✅ at edges | ❌ (by choice) | off top edge |
| 1.778 (16:9) | 1.38 | 13.8% – 86.2% | ✅ at edges | ❌ (by choice) | at top edge |
| 1.60 (16:10) | 1.24 | ~13.7% – 86.3% | ✅ at edges | ❌ (by choice) | ✅ |
| 1.50 (3:2) | 1.24 | ~16.0% – 84.0% | ✅ (slightly inset) | ❌ | ✅ |
| 1.33 (4:3) | 1.04 | ~13.7% – 86.3% | ✅ at edges | ❌ | ✅ |
| 1.20 | 1.04 | ~16.8% – 83.2% | ✅ (tight) | ❌ | ✅ |
| < 1.20 | nave mode | — | — | — | ✅ |

Two things fall out of this table that are worth stating plainly, because they change how the whole
page should be built:

- **Horizontal framing targets the same visible-x band (~13.8%–86.2%) on every bucket tuned for
  Matthew's test viewports (1920×1080, 1440×900).** Above ~1.9:1 the crown is already at the top edge
  at rest and leaves frame when we push; that's unavoidable with a full-bleed 16:9 plate and it is
  fine — the *legs* do the framing work at the sides, and `.plateRecess` (§3.2) plus the content's
  top mask-fade (§2.3) supply the "under an arch" cue when the crown is out of shot.
- **Below ~1.5:1 the cover crop has already framed the arch.** The dolly there is a vertical settle
  and a content crossfade, not a scale change. Don't force a push that the framing doesn't need.

*(Kate's original §1.2 text — 10%–90%, `--dolly-in: 1.25`, candles in frame — is superseded by this
amendment. Retained in git history only.)*

### 1.3 Resolution ceiling — how far we can actually push

The source is 1080p. Upscale factor in **device** pixels is
`(--plate-w × --dolly × devicePixelRatio) / 1920`.

| Window | DPR | At rest | At `--dolly: 1.38` (settled, Matthew) | At today's `1.49` |
|---|---|---|---|---|
| 1440 CSS px, 16:9 | 2 | 1.50× | 2.07× | 2.23× |
| 1920 CSS px, 16:9 | 1 | 1.00× | 1.38× | 1.49× |
| 2560 CSS px, 16:9 | 2 | 2.67× | 3.68× | 3.97× |
| 3840 CSS px (4K) | 1 | 2.00× | 2.76× | 2.98× |

House rule of thumb for soft oil paint under a grain overlay: **≤2.0× is invisible, 2.0–2.6× reads
as varnish-soft (acceptable, arguably flattering), >2.6× smears** — the moulding highlights lose
their edge and the bookshelf spines turn to porridge.

> **Amendment (Matthew, Aug 2026).** Kate's original ruling: **`--dolly` must never exceed 1.30** —
> 1.25 was both correct framing and a quality win. Matthew accepted **`--dolly-in: 1.38` at 16:9**
> as a deliberate trade for tighter "standing in the opening" framing (§1.2 amendment). This
> **exceeds the 1.30 ceiling** on settled viewports; the documented remedy remains the deferred
> **3840×2160 still** of the settled framing (`receiving-wall-zoomed.jpg` now exists in `public/` but
> is **not** crossfaded in — Matthew confirmed zoom is held on the video plate with no `.stageZoomed`
> layer). Backing the zoom off to satisfy 1.30 would fail the moulding-at-edges test.

**Do not crop or letterbox instead.** Letterboxing a full-bleed painted room to preserve pixels
trades the one thing the surface has (immersion) for a defect nobody has complained about. If the
softness ever does bother Kathryn or Tara-Lee, the correct answer is the **3840×2160 still** of the
settled framing — deliberately deferred for this pass, not a reason to revert §1.2.

**Mitigation that ships now:** the grain layer (§3.3). Fine tileable noise over an upscaled soft
image restores apparent high-frequency detail and reads as canvas tooth rather than as artefact.
This is the standard compositing fix and it is worth more here than any extra 200 pixels.

---

## §2 — Content inside the aperture

### 2.1 One variable chain, from the plate to the text

This is the crux of the brief. Register `--dolly` as a real number so it **interpolates**, then derive
the on-screen aperture rect from it. Everything — stage transform, content width, content vertical
inset, vignette geometry — reads the same chain, so content cannot drift from the arch.

```css
@property --dolly   { syntax: "<number>"; inherits: true; initial-value: 1; }
@property --dolly-y { syntax: "<length>"; inherits: true; initial-value: 0px; }
@property --tint    { syntax: "<color>";  inherits: true; initial-value: #e7d1ad; }

.wall {
  /* --- plate --- */
  --plate-w: max(100vw, calc(100svh * 16 / 9));
  --plate-h: calc(var(--plate-w) * 9 / 16);

  /* --- camera --- */
  --dolly: 1;
  --dolly-y: 0px;
  --dolly-ms: 1500ms;
  --dolly-ease: cubic-bezier(0.30, 0.10, 0.30, 1);

  /* --- the plate as it appears on screen, after the dolly --- */
  --wall-w: calc(var(--plate-w) * var(--dolly));
  --wall-h: calc(var(--plate-h) * var(--dolly));

  /* --- aperture, from the §0 manifest --- */
  --ap-w:       calc(var(--wall-w) * 0.62);   /* 19% → 81%  : the opening itself */
  --ap-safe-w:  calc(var(--wall-w) * 0.52);   /* 24% → 76%  : where content may live */
  --ap-safe-t:  calc(50svh + var(--dolly-y) - var(--wall-h) * 0.28);  /* source y 22% */
  --ap-safe-b:  calc(50svh + var(--dolly-y) + var(--wall-h) * 0.36);  /* source y 86% */

  /* --- type scale: deliberately does NOT include --dolly --- */
  --ap-base-w:  calc(var(--plate-w) * 0.52);
}

.wall.zoomed { --dolly: var(--dolly-in); --dolly-y: var(--dolly-in-y); }
```

`--dolly` is set on `.wall` and read by both `.plate` (transform) and `.aperture` (layout). Because
it is `@property`-registered as `<number>`, the transition on `.plate`'s `transform` and the layout
of `.aperture` advance **on the same curve, in lockstep**. That is the whole trick.

> **`@property` support:** Chrome 85+, Safari 16.4+, Firefox 128+. Where unsupported, `--dolly` flips
> discretely at the start of the move: the wall still animates (the `transform` transition handles
> that on its own) but the content box snaps to its final width immediately. Since content is faded
> out for the first 80% of the move (§4.1), this degradation is close to invisible. Acceptable; no
> polyfill.

> **Type never scales.** `--ap-base-w` omits `--dolly` on purpose. Content *width* tracks the camera;
> glyph size does not. Sizing type off `--ap-safe-w` would make the letters grow during the push,
> which breaks the illusion instantly — it stops being a camera and becomes a zoom control.

### 2.2 The content box

```css
.aperture {
  position: fixed;
  left: 50%;
  translate: -50% 0;
  width: min(var(--ap-safe-w), calc(100vw - 3rem), 68rem);
  top:    max(var(--ap-safe-t), 4svh);
  bottom: max(calc(100svh - var(--ap-safe-b)), 4svh);

  display: grid;
  grid-template-rows: 1fr auto;   /* records centred; the bench sits on the sill */
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: none;
}
.aperture::-webkit-scrollbar { display: none; }
```

Concrete widths, so the implementer can check their work:

| Window | State | `--ap-safe-w` | Applied width |
|---|---|---|---|
| 1920 × 1080 | idle | 998 px | 998 px |
| 1920 × 1080 | portal (1.25) | 1248 px | 1088 px (68rem cap) |
| 1440 × 900 | idle | 832 px | 832 px |
| 1440 × 900 | portal (1.12) | 932 px | 932 px |
| 1280 × 800 | idle | 740 px | 740 px |

The 68rem cap means that beyond ~2100px of scaled plate width the aperture stops governing and the
content sits centred with extra darkness inside the arch. **That is desirable, not a compromise** —
a wall of 1400px-wide rows would be unreadable, and generous void around the ledger is exactly the
portal read. Below that threshold the arch governs, which is the case on every window Matthew
actually uses.

Replace `.ledger { max-width: 56rem }` and `.zoom { max-width: 52rem }` with `max-width: 100%` — the
`.aperture` now owns width for both states. Prose inside a row (`.sourceBlurb`, `.letterBody`) keeps
its own readability cap: `max-width: 46rem`.

**Per-frame layout caveat.** Because `--ap-safe-w` contains `--dolly`, `.aperture` re-lays-out on every
frame of the move. Six flex rows is cheap and modern engines handle it, but if profiling shows jank
on low-end hardware, the documented fallback is: give `.aperture` a second variable
`--ap-step-w` that changes discretely at the fade boundary rather than continuously, and leave the
continuous chain to `.plate` alone. Do not do this pre-emptively.

### 2.3 Dissolve the content edges into the dark

A hard-clipped scroll container inside a painted opening reads as an iframe. Mask the content's top
and bottom so text fades into the void at the aperture edges:

```css
.aperture {
  mask-image: linear-gradient(180deg,
    transparent 0,
    #000 3.5rem,
    #000 calc(100% - 3.5rem),
    transparent 100%);
}
```

This is doing real work, not decoration: it means overflow *recedes into shadow* instead of being
cut off, which is how a recess behaves, and it supplies the "you are looking into something deep"
cue on wide viewports where the crown is out of frame.

### 2.4 Nave mode — viewports narrower than 6:5

At phone aspect (0.46) the cover crop shows source x 37% – 63%: no moulding, no candles, no arch. The
portal cannot be built by cropping. Two changes:

**(a) Pin the plate to the top and size it by width, not cover.**

```css
@media (max-aspect-ratio: 6/5) {
  .plate {
    top: 0;
    translate: 0 0;
    left: 50%;
    transform: translateX(-50%);
    width: 125vw;               /* maps source x 10%–90% to the viewport */
  }
}
```

The plate is then `125vw × 70.3vw` — the arch crown spans the top of the screen with both moulding
legs visible at screen x ≈ 9.2% and 90.8%, and the still-life ledge is below the plate's visible
run. Content sits under the crown, between the legs.

**(b) Extend the set below the plate.** Below the plate's bottom edge, continue the wall with a CSS
gradient sampled from the painting itself. Because the moulding legs are perfectly vertical below the
springing line (source y 30%), a horizontal gradient is an *exact* continuation of the wall at that
height — not an approximation.

```css
.plateSkirt {
  position: absolute;
  left: 0; right: 0;
  top: 100%;
  height: 160%;
  background-image:
    linear-gradient(180deg, rgba(12,14,10,0) 0%, rgba(12,14,10,0.55) 55%, rgba(12,14,10,0.82) 100%),
    linear-gradient(90deg,
      #191411 0%, #1f1410 2%, #2a1d15 4%, #29180e 6%, #564a34 8%, #483f2e 10%,
      #403726 12%, #68583e 14%, #725d42 16%, #867557 18%, #161712 20%, #25251b 22%,
      #333124 24%, #333327 26%, #2f2f23 28%, #313326 30%, #313328 32%, #37392e 34%,
      #373830 36%, #3c3d35 38%, #3e413a 40%, #3d4339 42%, #454b41 44%, #464940 46%,
      #474d41 48%, #494e47 50%, #444a40 52%, #40463c 54%, #3f443e 56%, #40453f 58%,
      #3e3f37 60%, #393a32 62%, #34352f 64%, #32322a 66%, #323228 68%, #313326 70%,
      #313125 72%, #2f2f23 74%, #353326 76%, #22231b 78%, #171715 80%, #65553c 82%,
      #816d52 84%, #544937 86%, #514936 88%, #433a29 90%, #514433 92%, #301e14 94%,
      #2d1f14 96%, #2c1b11 98%, #201911 100%);
}
```

Those 51 stops are the actual pixel row at source y = 60%, sampled every 2% of plate width. The
skirt is a child of `.plate`, so it inherits the transform and stays registered automatically at any
scale. Under the grain layer the seam is not findable.

**(c) Layout in nave mode:** `.aperture` reverts to normal document flow —
`position: static; width: min(82vw, 34rem); margin: 0 auto; padding-block: 38vw 4rem;` — page scrolls,
plate stays fixed behind. No internal scroll, no mask (both fight touch scrolling). The `38vw` top
padding clears the crown.

**Where I need eyes:** the skirt seam and the point at which the painted legs hand over to the
gradient legs. I have verified the colours are exact at the sample row; I have not seen it render.
**Fallback if it reads badly:** drop `.plateSkirt`, let the plate's bottom edge sit at the viewport
bottom (`height: 100svh; object-fit: cover; object-position: 50% 8%`), and accept a purely
crown-and-vignette portal on phones. Simpler, safe, slightly less magic.

---

## §3 — Making the text belong to the surface

### 3.1 First, the blocking bug nobody will spot

```css
/* CURRENT — delete this */
.wall > *:not(.stage) { position: relative; z-index: 1; }
```

`z-index: 1` on every content wrapper creates a stacking context on each, which **isolates
`mix-blend-mode`**: any blended element inside blends against its own transparent ancestor and
therefore does nothing at all. Every blend-based treatment below silently no-ops if this rule
survives. Replace with:

```css
.wall > * { position: relative; }        /* z-index: auto — no stacking context */
.stage    { z-index: 0; }                /* first in DOM, painted below */
.popOverlay { z-index: 30; }             /* unchanged */
```

Positioned siblings with `z-index: auto` paint in tree order, so DOM order alone gets the layering
right and blending reaches all the way down to the plate.

Second gotcha, same family: an ancestor with `opacity < 1` also isolates blending. `.contentEnter` /
`.contentExit` animate opacity on the content wrappers — so **do not put `mix-blend-mode` on the
text itself**; the blend would pop the instant the fade completed. All blending happens on the
varnish layers (§3.3), which never fade.

### 3.2 `.plateRecess` — give the opening depth

Inside `.plateBreath`, riding the transform, so its geometry is exact at any scale and costs nothing
on the GPU:

```css
.plateRecess {
  position: absolute;
  inset: 0;
  pointer-events: none;
  background:
    radial-gradient(ellipse 33% 42% at 50% 52%,
      rgba(9,11,8,0) 58%,
      rgba(9,11,8,0.45) 86%,
      rgba(9,11,8,0.70) 100%);
}
```

Percentages here are percentages *of the plate*, so this ellipse is tied to the aperture by
construction. It deepens the void toward its edges — reinforcing the fall the paint already has
(`#3b4039` centre → `#161712` at the inner edges) — and pulls the eye to the middle where the content
sits. It is what makes the opening read as *depth* rather than as a dark rectangle.

**Also: cut `.stageScrim` back hard.** Its current `rgba(23,26,24,0.55)` corner vignette plus a
`0.25 → 0.5` full-frame darkening is fighting the painting — it is why the moulding reads as grey mud
in the screenshots. Reduce to a top-only scrim that exists solely for header legibility:

```css
.stageScrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(18,20,15,0.45) 0%, rgba(18,20,15,0) 22%);
}
```

### 3.3 The varnish — one grade pass over everything

The reason the type reads as a separate layer is that it *is* one: it has no shared grain, no shared
falloff, no shared vignette. The fix is compositing discipline — put one grade layer above **both**
paint and type, so they receive the same treatment and become one image.

Three fixed, `pointer-events: none` siblings, **last in `.wall`'s DOM, with no `z-index`**:

```html
<div class="varnishTint"   aria-hidden></div>
<div class="varnishShade"  aria-hidden></div>
<div class="varnishGrain"  aria-hidden></div>
```

```css
.varnishTint, .varnishShade, .varnishGrain {
  position: fixed;
  inset: 0;
  pointer-events: none;
}

/* (a) the room's light takes the colour of the bay you're standing in */
.varnishTint {
  background: radial-gradient(ellipse 62% 58% at 50% 60%, var(--tint), transparent 72%);
  opacity: 0.06;
  mix-blend-mode: soft-light;
  transition: opacity 0.6s ease;
}
.wall.zoomed .varnishTint { opacity: 0.10; }

/* (b) the room falls away at the corners — seats the header and the frame edges */
.varnishShade {
  background:
    radial-gradient(ellipse 78% 72% at 50% 52%,
      rgba(9,11,8,0) 62%, rgba(9,11,8,0.30) 88%, rgba(9,11,8,0.52) 100%);
}

/* (c) canvas tooth — the layer that actually marries type to paint */
.varnishGrain {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)'/%3E%3C/svg%3E");
  background-size: 160px 160px;
  opacity: 0.09;
  mix-blend-mode: overlay;
}
```

**Why `.varnishGrain` is the highest-value item in this whole document:** it is the only change that
touches the type and the paint *identically*. Two images with the same grain read as one image. It
also disguises the 1.25× upscale (§1.3). If only one thing from §3 ships, ship this.

Deliberate decisions worth knowing:

- **No candle-pool layer.** The painting has real sconce light; adding CSS glows on top is gilding,
  and glows anchored to the sconce positions would have to track `--dolly`, forcing a full-viewport
  repaint every frame of the move. The three layers above are geometrically static, so they paint
  once and composite cheaply.
- **`feTurbulence` as a data URI, not a PNG.** No new binary asset, deterministic, ~300 bytes. It
  rasterises once per tile. *Caveat: turbulence output differs very slightly between engines — this
  is grain, so it does not matter. **Fallback** if the render is too coarse or too fine: commission a
  256×256 tileable chalk-tooth PNG from Kathryn / Tara-Lee and swap the URL; nothing else changes.*
- **`--tint` on `.wall`, not on the section.** Move the inline `style={{ "--tint": … }}` up from the
  `<section>` to `<main className={styles.wall}>` so the varnish can read it. Registered as
  `<color>` via `@property` so it *interpolates* between sage, terracotta and parchment as you move
  between bays — the light in the room changes when you open a different door. If `@property` is
  unavailable the tint switches instantly, which is fine.

- **Nave mode:** drop `.varnishTint` and `.varnishShade` (`display: none` under `max-aspect-ratio: 6/5`)
  and take `.varnishGrain` to `opacity: 0.06`. Three blended full-screen layers on a low-end phone is
  not a good trade for effects nobody can see at that size.

### 3.4 The incision — rewrite the letterpress stack

Current:

```css
text-shadow:
  0 -1px 1px rgba(0, 0, 0, 0.85),
  0 1px 0 var(--tint),
  0 2px 10px rgba(0, 0, 0, 0.5);
```

Three faults. The `0 2px 10px` blur is a **drop shadow** — a letter cut *into* a surface cannot cast
one, and that single declaration is most of why the type floats. The tint at full opacity gives a
hard coloured lower edge that reads as a CSS effect, especially in terracotta. And the fill
`#efe6cd` (L≈232) against a void at L≈40–60 is a five-fold luminance jump — brighter than anything
in the painting, so it cannot be *in* the painting.

Replace, on `.sourceName`:

```css
.sourceName {
  color: #ddd0ae;                 /* was #efe6cd — inside the room's exposure now */
  text-shadow:
    0 -1px 0   rgba(12, 14, 10, 0.92),                                  /* the cut's upper wall */
    0 -2px 3px rgba(12, 14, 10, 0.55),                                  /* soft interior of the cut */
    0  1px 0   color-mix(in oklab, var(--tint) 55%, transparent),       /* catch on the lower lip */
    0  2px 1px rgba(12, 14, 10, 0.35);                                  /* the lip's own micro-shadow */
}
```

Contrast against the void (`#3b4039`) stays above 8:1, so nothing regresses on accessibility. Depth
now comes from the varnish, not from per-glyph glow — which is why the fill can afford to come down.

Hover — currently `0 0 18px var(--tint)`, an unmistakable web glow. Replace with *catching more
candle*:

```css
.sourceRow:hover .sourceName {
  color: #ece0c0;
  text-shadow:
    0 -1px 0   rgba(12, 14, 10, 0.92),
    0 -2px 3px rgba(12, 14, 10, 0.55),
    0  1px 0   var(--tint),
    0  0   6px color-mix(in oklab, var(--tint) 30%, transparent);
}
```

Apply the same four-shadow structure, scaled down, to `.recordTitle` and `.zoomTitle`.

### 3.5 The rules between rows

`border-bottom: 1px solid rgba(231,209,173,0.14)` running the full content width is, line for line,
the most "web page" mark on the surface. Replace with a **line scored into the plaster** — two-tone,
and fading out at both ends so it never terminates in a hard stop:

```css
.sourceRow, .recordRow {
  border-bottom: 0;
  background-image:
    linear-gradient(90deg, transparent 0, rgba(12,14,10,0.55) 14%, rgba(12,14,10,0.55) 86%, transparent 100%),
    linear-gradient(90deg, transparent 0, rgba(231,209,173,0.15) 14%, rgba(231,209,173,0.15) 86%, transparent 100%);
  background-size: 100% 1px, 100% 1px;
  background-position: 0 calc(100% - 1px), 0 100%;
  background-repeat: no-repeat;
}
```

Dark above, light below: light arrives from the sconces above the horizontal, so a scored groove
shadows on its upper wall and catches on its lower. Same logic as the letterforms, one pixel wide.

### 3.6 Per-source tint, properly

Today `--tint` lights an edge and a numeral. Given the varnish it can do its actual job — change the
light in the room. Three places, no more:

| Element | Treatment |
|---|---|
| `.varnishTint` | ellipse of `--tint` at 6% idle / 10% zoomed, `soft-light` |
| `.sourceName` / `.recordTitle` lower lip | `color-mix(in oklab, var(--tint) 55%, transparent)` |
| `.sourceCountNum`, `.recordChevron` | `var(--tint)` (unchanged) |

Values from `lib/receiving-wall.ts`, unchanged: external `#9aa77a` (sage, cool), user-guided
`#d77545` (terracotta, warm), chat `#e7d1ad` (parchment, neutral). At idle, `--tint: #e7d1ad`.

The intent: External Context Capture should feel like a cooler, more clinical light than User Guided
Capture. At 6–10% soft-light that is felt rather than seen, which is right — **if it reads as a
colour cast, halve it.** Kathryn / Tara-Lee's call.

### 3.7 The header (Tier 2 — outside the six asks, do last or not at all)

`text-shadow: 0 2px 18px rgba(0,0,0,0.6)` on `.title` is a glow, same fault as §3.4. Give it the
incision stack from §3.4 at ~0.8 scale. The header sits over the bookshelves rather than the void, so
`.varnishShade`'s corner falloff is what seats it. Leave the position alone — top-left over the shelf
is correct; it is the *treatment* that reads as chrome, not the placement.

---

## §4 — The move

### 4.1 Timings

Matthew: *"it stops zooming too quickly."* The current CSS transition is 900ms with
`cubic-bezier(0.45, 0, 0.16, 1)` — an S-curve whose `p2 = (0.16, 1)` reaches its terminal value early
and then holds, so the camera arrives and **parks**. Meanwhile the bay is held back until the wall is
completely dead (`ARRIVE_MS = 1160 = 260 + 900`), so the viewer watches a full beat of stillness
before anything happens. That combination is the "stops too quickly" feeling; the short travel just
makes it worse.

Three changes: travel longer in time (shorter in distance), keep velocity later in the curve, and let
the content start arriving *before* the camera settles.

| Constant | Now | **New** | Why |
|---|---|---|---|
| `EXIT_MS` | 260 | **220** | ledger gone before the camera moves — never watch text slide |
| dolly duration (CSS `--dolly-ms`) | 900 | **1500** | a dolly is slow; 900ms is a cut with extra steps |
| `ARRIVE_MS` | 1160 | **1420** | bay begins entering at 80% of the move — content rises out of the dark while the camera is still creeping |
| `RETURN_MS` | 260 | **260** | unchanged |
| pull-back duration | 900 | **900** | cameras pull out faster than they push in |
| `SETTLE_MS` (new) | — | **880** | `RETURN_MS + 620`: hold the ledger out until the pull-back is nearly home |
| bay→bay swap | `EXIT_MS` | **220** | unchanged in kind, matched to the new exit |

```ts
const EXIT_MS   = 220;   // ledger fade-out before the dolly begins
const ARRIVE_MS = 1420;  // bay begins entering, ~80% through the 1500ms dolly
const RETURN_MS = 260;   // bay fade-out before the pull-back
const SETTLE_MS = 880;   // ledger held out until the pull-back is nearly home
```

Easing:

```css
--dolly-ease: cubic-bezier(0.30, 0.10, 0.30, 1);      /* push in  */
--dolly-ease-out: cubic-bezier(0.40, 0.00, 0.20, 1);  /* pull back */
```

Soft take-up, near-linear through the middle, decelerating over the last third without stalling.
**No overshoot.** A dolly on a track does not bounce; springy arrival would read as toy UI and would
fight the register. What Matthew is missing is not a bounce, it is a tail — §4.3 supplies it.

### 4.2 One new beat in `ReceivingWall.tsx`

The pull-back currently drops `zoomed` to `null` at `RETURN_MS`, which re-enters the ledger while the
camera is still travelling. Add a `settling` beat:

```
type Beat = "idle" | "exiting" | "zooming" | "zoomedIn" | "returning" | "settling";
```

In `closeZoom`, from `zoomedIn`:

```ts
setBeat("returning");
after(RETURN_MS, () => { setZoomed(null); setBeat("settling"); });   // .zooming drops → pull-back starts
after(SETTLE_MS, () => setBeat("idle"));                              // ledger re-enters at rest
```

Ledger state becomes `beat === "idle" ? contentEnter : contentExit` — `settling` keeps it out.
`moving` (the flag that holds `.zooming` on) is unchanged: `"zooming" | "zoomedIn" | "returning"`.
Escape handling must also accept `settling` as cancellable (re-entering a source from `settling`
should clear pending timers and run the normal `idle → exiting` path).

### 4.3 The breath — the thing that actually fixes "it stops"

A camera that arrives and freezes reads as a slideshow. Give the wall a perpetual, barely-perceptible
drift so it is never static. This costs one element and one keyframe, and it is the highest-value
item in §4:

```css
.plateBreath {
  animation: wallBreath 22s cubic-bezier(0.45, 0, 0.55, 1) infinite alternate;
}
@keyframes wallBreath {
  from { transform: scale(1)     translateY(0);      }
  to   { transform: scale(1.028) translateY(-0.4vh); }
}
```

It lives on a **separate element** from `.plate` precisely so it cannot collide with the dolly
transition. 2.8% over 22 seconds is below the threshold of conscious detection but comfortably above
the threshold of "this is alive". It runs in both states — the idle wall breathes too.

The breath is not included in the `--ap-safe-w` chain, so content geometry can be up to 2.8% out at
the extreme of the cycle. The safe box carries 5pp of margin inside the aperture on each side, so
this cannot cause a collision.

### 4.4 `prefers-reduced-motion`

Pin the camera, keep the design:

```css
@media (prefers-reduced-motion: reduce) {
  .stageVideo   { display: none; }
  .plate        { background: url("/agent-cast/clives-man/receiving-wall-poster.jpg") center / cover no-repeat;
                  transition: none; will-change: auto; }
  .plateBreath  { animation: none; }
  .wall, .wall.zoomed { --dolly: 1; --dolly-y: 0px; }   /* no push, either state */
  .ledger, .zoom { transition: opacity 0.2s ease; }
  .contentExit, .contentEnter { transform: none; }
  .varnishTint  { transition: none; }
  .letter, .popOverlay, .popPanel { animation: none; }
  .sourceRow, .recordRow { transition: none; }
}
```

Pinning `--dolly: 1` loses nothing structurally: the aperture chain derives from `--dolly` whatever
its value, so at 1.0 the content simply sits inside the *unpushed* arch, correctly framed. **The
portal is a layout, not a camera move** — the dolly is dramaturgy laid on top. That is the strongest
argument that the geometry in §2 is right.

JS timings under reduced motion (use the existing `usePrefersReducedMotion` hook, currently exported
from `components/command-centre/usePortraitTransition.ts` — move it to `lib/` if a shared home is
wanted, but do not duplicate it):

```ts
const T = reducedMotion
  ? { EXIT: 120, ARRIVE: 240, RETURN: 120, SETTLE: 240 }
  : { EXIT: 220, ARRIVE: 1420, RETURN: 260, SETTLE: 880 };
```

---

## §5 — Kill list

Confirmed dead or unwanted. Delete outright; do not comment out.

| # | What | Where |
|---|---|---|
| 1 | `<div className={styles.stageZoomed} style={{ backgroundImage: … }} />` | `ReceivingWall.tsx` lines 205–210 |
| 2 | `.stageZoomed` rule | `receiving-wall.module.css` lines 47–55 |
| 3 | `.stage.zooming .stageZoomed { opacity: 1 }` | lines 59–61 |
| 4 | `.stageZoomed` reduced-motion override | lines 561–563 |
| 5 | `<p className={styles.ledgerHint}>Choose a door to read what waits within.</p>` | `ReceivingWall.tsx` lines 242–244 |
| 6 | `.ledgerHint` rule | lines 185–194 |
| 7 | `.wall > *:not(.stage) { … z-index: 1 }` | lines 71–74 — **see §3.1, this one is load-bearing** |
| 8 | `overflow-x: hidden` on `.wall` | line 22 — clipping moves to `.stage` |
| 9 | `Sit with Clive` button in `.header` | `ReceivingWall.tsx` lines 220–223 — replaced by §6 |
| 10 | `.summonBtn` pill styling | lines 124–145 — replaced by `.incisedAction` (§6.3) |
| 11 | The dolly-zoom comment block describing the crossfade | `.module.css` lines 5–17 and `.tsx` lines 23–43 — rewrite to match this spec |

**#1 is not a taste call.** `/agent-cast/clives-man/receiving-wall-zoomed.jpg` does not exist in
`website/public/agent-cast/clives-man/` (verified: the folder holds `hero.png`,
`receiving-wall.mp4`, `receiving-wall-poster.jpg`, `animations/`) and is not gitignored. Every page
load requests it and takes a 404. The layer has never been visible. Matthew's instinct that "we don't
need the second image" is not a change of direction — it is the current behaviour, made honest.

**The floating pill is already gone.** The "Chat with Clive" pill in screenshots 2 and 3 was
`website/src/components/GlobalCliveLauncher.tsx`, mounted in `app/layout.tsx`. Both the component
file and its two mount lines are **deleted in the working tree at time of writing** — no live
references remain anywhere in `website/src`. Nothing to remove; §6 supplies its replacement. If that
deletion is reverted for any reason, the launcher must not be re-mounted on this route.

---

## §6 — Two Clive entry points

Both must read as fittings of the room. No pills, no floating widgets, no shadows: a pill is a
button that has been given a body, and there are no plastic buttons in a Victorian library.

### 6.1 Idle wall — "The bench"

The painting hands us this: a stone ledge across the bottom of the aperture with a **sealed letter
and a quill** already lying on it (source x 27%–44%, y 87%–93%). That is where a man sits to read.
The idle Clive entry is that bench, rendered as type in the same incised language as the doors —
a distinct section closing the wall, not a control.

Placement: bottom row of `.aperture`'s grid (`grid-template-rows: 1fr auto` — the source list centres
above, the bench sits on the sill). On viewports where the painted ledge is in frame it lands
directly above it, which is a gift rather than a requirement.

```
    ⟨scored rule, §3.5, 40% width, centred⟩

              T H E   B E N C H
        He waits here between readings.
              Sit with Clive →
```

Copy, verbatim:
- kicker: `THE BENCH`
- line: `He waits here between readings.`
- action: `Sit with Clive →`

```css
.bench {
  text-align: center;
  padding: 2.5rem 0 0.5rem;
  position: relative;
}
/* a candle set down on the bench — the only light in the lower void */
.bench::before {
  content: "";
  position: absolute;
  inset: 0 -12% -20%;
  background: radial-gradient(ellipse 46% 78% at 50% 62%,
    color-mix(in oklab, var(--color-parchment) 22%, transparent), transparent 70%);
  opacity: 0.5;
  pointer-events: none;
}
.benchKicker {
  font-family: var(--font-wall), serif;
  font-size: 0.68rem;
  letter-spacing: 0.42em;
  text-transform: uppercase;
  color: rgba(221, 208, 174, 0.62);
  margin: 0 0 0.55rem;
}
.benchLine {
  font-family: var(--font-wall), serif;
  font-style: italic;
  font-size: 0.98rem;
  color: rgba(240, 230, 204, 0.7);
  margin: 0 0 0.9rem;
}
```

The `.bench::before` pool is the piece I most want Kathryn / Tara-Lee to judge — a warm glow with no
visible source is a cheat, and the honest version is a painted candle on the ledge, which is a
commission. **Fallback if it reads as a CSS glow: delete `.bench::before` entirely.** The type alone
still works.

### 6.2 Zoomed bay — "the margin note"

Available in every bay including empty ones. Renders as the final entry on the wall, in the rhythm of
the record rows but with no chevron and no rule beneath — a note in the margin of the ledger rather
than another record.

```
  ─────────────────────────────────
  Clive can read this bay and propose what each record becomes.
                                              Sit with Clive →
```

Copy, verbatim: `Clive can read this bay and propose what each record becomes.` + `Sit with Clive →`

```css
.margin {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 1.5rem;
  padding: 1.25rem 0.25rem 0;
  margin-top: 0.5rem;
  font-style: italic;
  font-size: 0.92rem;
  color: rgba(240, 230, 204, 0.62);
}
```

Render it after `.recordList` **and** after the `.empty` message — an empty bay is exactly when
someone most needs Clive.

### 6.3 `.incisedAction` — replaces `.summonBtn` everywhere

One shared treatment for all three Clive calls (bench, margin note, and `Decide with Clive` inside an
open letter). Cut into the surface like everything else; the arrow is the only ornament.

```css
.incisedAction {
  font-family: var(--font-wall), serif;
  font-size: 0.95rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  background: transparent;
  border: 0;
  padding: 0.4rem 0;
  cursor: pointer;
  color: #ddd0ae;
  text-shadow:
    0 -1px 0 rgba(12, 14, 10, 0.9),
    0  1px 0 color-mix(in oklab, var(--tint) 55%, transparent);
  transition: color 0.18s ease, letter-spacing 0.18s ease;
}
.incisedAction:hover { color: #f0e5c6; letter-spacing: 0.17em; }
.incisedAction:focus-visible {
  outline: 2px solid var(--tint);      /* the varnish glow, per house input rules */
  outline-offset: 5px;
  border-radius: 2px;
}
```

The header keeps only `To the brains →` (`.ghostLink`, unchanged). With the bench on the idle wall
and the margin note in every bay, Clive is reachable in both states without a persistent control —
which is the point: he is a person in the room, not a support widget in the corner.

### 6.4 The expanded letter — incised, not panelled

**Amendment (Matthew, Aug 2026).** An open record ("the letter") must read as text carved into the
plaster like every other element on the wall — not as a UI card dropped onto the painting.

When a record expands:

- **No panel.** Remove background fill, border, border-radius, and coloured left-edge stripe. The
  letter sits directly on the void/plaster.
- **Separation from the collapsed row** uses a scored hairline rule (§3.5 two-tone gradient, fading
  at the ends) plus type hierarchy — larger incised title, uppercase meta line, body prose — not a
  box.
- **Actions are incised text, not buttons.** `Accept`, `Discuss with Clive`, and `Fold the letter`
  remain real `<button>` elements for accessibility, but visually match `.incisedAction` (§6.3):
  small caps, letter-spaced, gold/warm carved treatment. No pill chrome, no filled backgrounds.
- **Hierarchy without boxes.** `Accept` is primary: slightly larger weight and size, brighter incised
  stack (same four-shadow structure as `.recordTitle`). `Discuss with Clive` uses `.incisedAction`.
  `Fold the letter` uses a muted incised variant (`.incisedActionMuted`).
- **Accept states stay legible incised:** pending (`Accepting…`, reduced opacity, `cursor: wait`),
  success (`Accepted`, sage-tinted incised text), error (italic incised line in warm red — no alert
  box).
- **Accessibility non-negotiable:** visible `:focus-visible` ring (tint outline, 5px offset), explicit
  `aria-label` / `aria-busy` on Accept, touch targets ≥ 44×44px via padding on the incised buttons
  (font size stays small).

Do not reintroduce `.acceptBtn` fill/border styling or `.ghostBtn` pill borders on the letter surface.

---

## §7 — Build order, acceptance, and what needs Kathryn / Tara-Lee

### Order (one concern per commit, per the build pack's drift controls)

1. **Manifest.** New `website/src/lib/man/receiving-wall-manifest.ts` — the §0 table as typed data
   (`APERTURE`, `ARCH_CURVE`, `SCONCES`, `PALETTE`). Geometry as data is house convention; the CSS
   custom properties in §2.1 must carry a comment pointing at it.
2. **Kill list** (§5). Nothing else; verify the page still renders.
3. **Plate + dolly** (§1). Framing only — no content changes yet. Screenshot every bucket in the §1.2
   table and check the visible-x column.
4. **Aperture chain** (§2.1–2.3). Content lands inside the arch in both states.
5. **Nave mode** (§2.4). Phone and small-tablet portrait.
6. **Varnish + incision** (§3). Ship `.varnishGrain` first and look at it before adding the other two.
7. **Timings + breath** (§4).
8. **Clive entry points** (§6).

### Acceptance checks

> **Amendment (Matthew, Aug 2026).** Kate's original pass/fail: *both moulding legs visible with
> lit plaster outside them* (candles in frame). **Superseded.** New pass/fail at settled zoom:
> **stone moulding legs at or very near the left and right frame edges; bookshelves and candle
> sconces out of frame.** If bookshelves are visible either side, zoom is not far enough. Verify at
> 1920×1080 and 1440×900. Content safe box (source-x 24%–76%) must still clear the stone mouldings
> (~16.7%–19% / ~81%–83.3%) — confirm no text overlaps stone.

- At every bucket in §1.2 (amended table), **moulding legs at frame edges at settled state**;
  bookshelves and sconces cropped out. This is the single pass/fail test for "portal".
- No content element ever crosses source x 24%/76% or y 22%/86%. Check by temporarily setting
  `.aperture { outline: 1px solid red }` against the arch.
- The move: 1500ms, no dead stop, bay rising before the camera settles, wall never fully static.
- Reduced motion: same states, no camera, content still framed by the arch.
- Zero network 404s on load (this is now a regression test, given §5 #1).
- Keyboard: every door, record, and Clive call reachable; Escape steps back one level from
  pop-out → letter → bay; focus ring is the tinted varnish glow at `outline-offset: 5px`.
- Run the `web-design-guidelines` skill on `ReceivingWall.tsx` and `receiving-wall.module.css`; put
  the findings (or "audit clean") in the PR description with a before/after table for the interaction
  changes. A PR without the audit note is incomplete.
- Cite this spec and the Chapter 1 craft build pack in the PR. No copy change here alters a public
  claim, but say so explicitly so Matthew can gate it consciously.

### Open calls — Kathryn / Tara-Lee judge, Matthew approves

1. **Settled framing.** ~~10%–90% is my recommendation~~ **Superseded (Matthew, Aug 2026):**
   13.8%–86.2% at 16:9, `--dolly-in: 1.38`, "standing in the opening" — see §1.2 amendment.
2. **`--dolly-in-y: 2.5vh`.** The composition sinks slightly as we push, so we see a touch more above
   the crown. Could equally hold the horizon at 0. Taste.
3. **Grain weight** (`--varnishGrain` at 0.09). The whole "does the type belong" question turns on
   this number. Judge it on a real display, not a screenshot.
4. **Tint strength** (6% idle / 10% zoomed, soft-light). If it reads as a colour cast rather than a
   change in the light, halve it.
5. **`.bench::before` candle pool.** A glow with no source. Keep, delete, or commission a painted
   candle on the ledge.
6. **Nave-mode skirt seam** (§2.4b). Colours are exact; the handover point is not verified rendered.

7. **Portal back-light — artwork required (Matthew, Aug 2026).** Two CSS attempts to make the
   aperture read as *emitting* light failed the same way: geometric ellipses painted on top of the
   painting, washing out incised text. **Do not retry in CSS.** The approved baseline is lifted room
   spill via soft-light on `.roomStatic::after` (sconces + gentle room lift); the portal interior
   stays a dark recess for cream-text contrast until art carries the rim.

   **What to commission (designer brief — Kathryn / Tara-Lee / Matthew):**

   | Option | Asset | When to use |
   |---|---|---|
   | **A (preferred)** | Regrade of `receiving-wall-poster.jpg` (1920×1080, same camera as today) | Light baked into the room plate — mouldings, plaster, ledge catch it naturally |
   | **B** | Separate **rim/spill overlay** PNG, 1920×1080, transparent outside effect | If the base poster must stay untouched; composite above poster, below UI text |

   **What the light must do (plain language):**

   - Hottest at the **aperture edge** where the opening meets the stone — a back-lit rim, not a white
     oval centred on the wall.
   - **Follow the arch curve** from `ARCH_CURVE` in `website/src/lib/man/receiving-wall-manifest.ts`
     (inner edge x 19%→81%, crown apex y ≈ 8.15%, void bottom y ≈ 89.5%). No straight lines, no
     rectangles, no lens-flare blob across the mouldings.
   - **Spill onto the room side:** inner faces of the mouldings catch light; lit plaster either side
     falls off with distance; a soft throw onto the **stone ledge and letters/quill** in front of the
     opening (manifest `LEDGE_STILL_LIFE`: x 27%→44%, y 87%→93%).
   - **Interior stays deep** inside the hole — the cream UI text lives there. A hint of warmth/brighter
     tone *deep back* in the void is fine; do not brighten the whole interior surface.

   **Alignment:** overlay (option B) must register pixel-perfect with the existing static plate at
   `object-fit: fill` on a 16:9 plate. The arch hole is already cut by `roomStaticClipPath()` /
   `ARCH_CURVE`; spill belongs on the **room** side of that boundary (and optionally a very subtle
   inner-edge rim *inside* the hole, but must not compete with text).

   **Format:** PNG, sRGB, 1920×1080. Option B: alpha channel — fully transparent where there is no
   light effect; premultiplied or straight alpha documented. Deliver a still that matches
   `receiving-wall-poster.jpg` framing exactly.

   **Compositing (when art lands):** add as a layer on `.plate` — e.g. `roomStatic` background +
   optional `portalSpillArt` overlay sharing the same clip-path as the room plate (outside arch) and/or
   an interior-edge layer masked to the arch interior only, **below** `.surfaceContent` (z-index). Remove
   or reduce CSS spill gradients that duplicate the art. UI incised text stays on top, untouched.

### One thing worth commissioning later, deliberately not now

A **3840×2160 still of the settled framing** — the asset `.stageZoomed` was always reaching for. It
would lift the resolution ceiling in §1.3 and let the dolly go deeper if anyone ever wants it. Not
needed for this pass, and shipping the dead layer while waiting for it is exactly the fault we are
removing.
