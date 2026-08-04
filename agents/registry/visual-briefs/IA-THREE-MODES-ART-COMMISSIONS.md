# Art Commission Handovers: IA Three Modes — the House and the Shells

**For:** Kathryn Goodchild (Hyperagent), with Tara-Lee — visual-finish authority
**From:** Matthew, via the IA Build Brief v1.0 (Clive, 4 Aug 2026; Pam Cleared V2) and the build plan (`docs/initiatives/ia-three-modes-build-plan.md`)
**Status:** Brief approved, build dispatched 4 Aug 2026. **These commissions do not gate the build** — code ships behind placeholders; art replaces them as it lands. Each commission is severable: take them in any order, one HA thread each.
**Integration:** Kate (scenic workshop) receives and wires everything; she never originates art. Matthew approves all finish.

## Standing constraints (all five commissions)

- **House register:** rich Old-Master oil, visible brushwork, warm varnish, ornate frames; premium, adult, warm, mild darkness where canon calls. HARD AVOID: childish/cute/cartoon/mascot energy; sci-fi neon, LCD, modern UI chrome inside painted scenes; gore.
- **Palettes:** Surface — Pale Cream `#F3EDDB`, Cream Paper `#FAF7ED`, Ink `#23271B`. Night — Deep Moss `#202A1B`, Graphite Ink `#171A18`, Parchment Dim `#E7D1AD`. Accents — Terracotta `#A95A2E`, Burnt Apricot `#D77545`, Sage Signal `#9AA77A`.
- **Locked canons are constraints:** Brain Vault five states, Doc's Workshop scene, cast portraits. Check before touching anything adjacent.
- **Layer delivery (Kate's requirement, specify from the start):** each interactable on its own transparent ground; state changes as pre-baked variants; plaques ship BLANK (all text is laid live in code); 4K masters; motion as alpha-video accents (WebM/VP9 alpha + HEVC-alpha MOV pair) over stills wherever a still + accent reads as well; poster = frame-zero PNG per loop.

---

## Commission 1 — The House room collage (the hub)

The product's daily hub: one painted house interior presenting eight rooms as a collage the operator clicks into. The build renders rooms from a data registry, so the composition must **tolerate additions by design** — deliberate overflow or new wings for future rooms (Beaver in casting, Luwani new; a ninth room arrives by registry entry, never by bespoke recomposition).

**Rooms v1:** The Study (Clive) · The Court (Pam) · Brain Vault (—) · Receiving Wall (Clive's Man) · The Workshop (Doc) · The Lodge (The Beaver) · Physician's Room (Hal) · Coach's Room (The Coach).

**Each room needs two fitted states** (plus the dust sheet, Commission 2):
- **Lit and live** — inviting, the owner's character present or implied.
- **Fitted but quiet** — lit, furnished, honestly "nothing to report yet"; never a fake of activity, never a second shroud.

Rooms whose owner is not authorised for this operator should read as *not inviting entry* — a closed door reads differently from a shrouded one.

**Delivery:** background architecture as one layer; each room threshold/doorway as its own transparent interactable layer with the state variants above; blank plaques for room names.

## Commission 2 — Dust sheets (the unlock model)

The "not yet introduced / not yet configured" state: **shrouded canvas in an unlit alcove — never a blank grey square.** The sheet is theatre for anticipation, not denial; clicking one yields a small Clive line (copy is Kate's draft, Matthew's approval — not part of this commission).

- One adaptable dust-sheet treatment that sits over any room threshold from Commission 1, or per-room variants if the collage's geometry demands it — your call.
- Must read at collage scale and at focus scale.
- The sheet comes off the moment a function is needed (unlock by function, never narrative pacing) — so the transition sheet-off → fitted-room should be simple to stage (crossfade between layer variants; no baked-in composite).

## Commission 3 — Hal: portrait and the Physician's rooms

**No Hal asset exists on the site — confirmed.** Two deliverables:

1. **Cast portrait** for the wall and his room: Hal's locked identity governs — **tuskless elephant, army-medic register** (Prof. Halvard Bjørnson). Consult his character spine before designing; his portrait joins a locked-canon portrait set, so match its framing conventions.
2. **The Physician's Room (customer-facing, in the House):** practice notes, inspection plates, honest vitals — a consulting room that can display "Not Graded" as a *designed* state (an empty inspection plate is a designed object, not a missing one). No numbers theatre; the register is calm clinical honesty inside the painted world. Blank plates throughout — all vitals text is live.

(The internal `/command/hal` consulting room is code-only for now; no art gate.)

## Commission 4 — Fast-path furniture (the daily presentation)

The House's daily mode leads with three functional slots — **Continue · Needs attention · Recently visited** — before the collage. **Matthew's binding register caveat:** this is a *fitting of the house* — a day-book open on a hall table, a butler's board — **never floating SaaS chrome**. The receiving-wall philosophy governs: physical incision, no plastic buttons.

- The function is non-negotiable; the furniture is yours. Three slots, each carrying live text (blank plates / blank paper — 9-slice-friendly flat areas Kate can lay type into) and one stable click target each.
- Must sit at the top of the House view without fighting the collage.

## Commission 5 — Founding-cast wall edit (verification + touch-up)

The homepage portrait wall (`FoundingCastHero`) loses the Doc's Minions cluster — the wall's job is recognition only (*who will I meet?*); the minion pattern lives on in Method/Workshop material. Kate removes the cluster in code.

**Your part:** confirm whether the cluster is fully separable in the existing layered art. If its removal leaves a compositional hole or shadow ghosting in the background plate, supply the patched background. If it separates cleanly, this commission closes with a nod. (Hal's new portrait — Commission 3 — may also want a wall position; propose one.)

---

**Sequencing pressure, gentlest first:** none of this blocks code. If ordering by build benefit: 2 (dust sheets) and 4 (fast path) land in Phase 3, 1 (collage) is Phase 3's centrepiece, 3 (Hal) is Phase 6, 5 whenever Kate's wall PR is up.
