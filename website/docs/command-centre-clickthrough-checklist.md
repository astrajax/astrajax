# Command centre — manual click-through checklist

Use this after changes to the homepage command centre, story modes, or brain review. Tick each box when it passes.

**How to run:** open the site locally (`npm run dev`) or your preview URL in a desktop browser (1280px wide or wider for portrait doors).

---

## Story modes

Default is **Full story** (portrait doors + **All platform surfaces** heading). There is no nav toggle — alternate modes are set via browser localStorage key `astrajax-story-mode` (`full` | `light` | `no-story`), then hard-refresh.

- [ ] **Full story (default):** Homepage hero shows three portrait doors. Platform section heading reads **All platform surfaces**.
- [ ] **Light story:** Set localStorage to `light`, refresh. Heading switches to **Core features** and room chips appear (Clive's study, Doc's workshop, Pam's desk).
- [ ] **No story:** Set localStorage to `no-story`, refresh — same flat directory as Light story (no portrait navigation on click).

---

## Portrait doors (Full story)

- [ ] Click **Clive's portrait** → lands on `/command/clive`.
- [ ] Click **Back to command centre** → returns to homepage `#agent-cast` with **keyboard focus on Clive's portrait link** (Tab once should move to the next portrait, not restart from the top of the page).
- [ ] Repeat enter/exit for Doc and Pam if you touched focus-restore code.

---

## Brain review deep link

- [ ] Open `/brain/review?view=actionProposed` in a **new tab** (hard refresh).
- [ ] **Outstanding actions** tab is highlighted — not Needs review.
- [ ] Network tab (optional): list request includes `actionProposed=true`.

---

## Doc's Workshop build demo

- [ ] Open `/command/doc` — workshop stage visible.
- [ ] Click **Design the fleet** hotspot (left alcove) → lands on `/command/doc/build`.
- [ ] Walk Trinity steps through **Approve build** with your name filled in.
- [ ] **View export** shows governed defaults table with **Auto-save memories: false**.
- [ ] **Download export JSON** link serves `agent-external-context-scanner-v0_1.json`.
- [ ] Footer link **Fleet design (full surface)** → `/fleet`.

---

## Regression script (optional)

```bash
npm run test:command-centre
npm run test:e2e
```

Both should pass before you ship.
