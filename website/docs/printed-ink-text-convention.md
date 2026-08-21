# Printed-ink text — house convention

**Status:** canonical material, centralised 6 Aug 2026 (branch `kate/printed-ink-shared-layer`).
**Source of truth:** `website/src/app/globals.css` — the "Printed-ink text — SHARED LAYER" block.

The printed-ink treatment makes live, dynamic text read as **ink absorbed into
parchment/paper art** rather than laid on top of it. It is the house default for
any painted-page surface (Living Folio, Court, and future book/parchment
surfaces). The text stays live HTML — selectable, searchable, responsive,
zoomable, screen-reader-safe. **Never** ship pre-rendered or distressed text
images for this effect.

## The one rule

If you are building a parchment/paper surface, **opt into the shared layer**;
do not re-derive the fibre tile, the shadow values, or the page-veil geometry.

Three steps:

1. **Make the surface an ink surface.** Give the page container the measured
   page bounds it needs via the `--ink-page-*` custom properties (defaults are
   the Living Folio book spread). Add the surface's class to the shared
   `.ink-surface::before/::after` selector group in `globals.css` so the fibre
   veil renders (or add `ink-surface` to the element's class list in JSX).
2. **Map your content classes onto the three presets.** In a thin per-surface
   scope (see `FOLIO SCOPE` and `COURT SCOPE` in `globals.css`), point your
   body/heading/label classes at:
   - `var(--ink-body-shadow)` — normal readable ink
   - `var(--ink-display-shadow)` — headings / emphasis (same ink pressed harder)
   - `var(--ink-label-shadow)` — small labels, least texture
   Warm parchment (the Court) uses the `-warm` variants and a denser
   `--ink-fibre-opacity`.
3. **Respect the accessibility fallbacks** the layer already provides:
   forced-colours strips the texture and the fibre; small labels drop the
   shadow on narrow viewports; the fibre is static and reduced-motion-safe.

## The exception route — `.no-ink`

The smallest opt-out. Put `class="no-ink"` (or the utility on a wrapper) on
**controls, code-like UI, dense data, or any small label where texture harms
legibility**. It strips the ink shadow from the element and its descendants.
Engraved brass lettering and status seals are already separate materials and
never take the ink texture — don't add `.no-ink` to them.

## Implementation notes (locked)

- No `mix-blend-mode: multiply`, no SVG displacement filter, no text blur —
  blend was muddy and browser-variable and risked small-label legibility.
- The material work is (a) one faint seamless paper-fibre overlay per page
  (`--ink-fibre`, pointer-events:none) and (b) a restrained sub-pixel
  `text-shadow` per preset. Identical in Chromium and Safari.
- Base ink is **Ink #23271B** — the surface palette, not sepia.

## If you ever reach for `-webkit-text-stroke`

The shared layer does not use text stroke today — everything above is fibre
plus restrained `text-shadow`. If a future letterpress or outlined-text
treatment genuinely needs `-webkit-text-stroke` (still required unprefixed-
less for all browsers), be aware of the known centre-alignment artifact:
the stroke straddles the glyph outline, so half the stroke width paints
*inside* the fill, muddying counters and thin serifs at small sizes.

The house fix is paint ordering, not pixel-tuning: set
`paint-order: stroke fill` so the fill paints over the stroke's inner half
(the outer half remains as the visible outline). This does not change the
centre-aligned geometry — it only corrects which paint lands on top — so it
pairs with the same restrained-strength habit as the shadows: keep stroke
widths thin, and let the fibre/veil layers marry the result to the page.

Reference: CSS-Tricks, "What's !important #17" (14 Aug 2026), citing Tyler
Sticka — https://css-tricks.com/whats-important-17/

## Regression check

`website/src/components/chapter1/printed-ink.test.ts` (vitest) asserts the
shared layer still defines the fibre, the three presets, the page geometry and
the `.no-ink` route, and that the Folio and Court scopes still consume them.
Run it with the chapter-1/brain vitest suites.
