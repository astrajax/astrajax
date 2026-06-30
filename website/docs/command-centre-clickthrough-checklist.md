# Command centre — manual click-through checklist

Use this after changes to the homepage command centre, story modes, or brain review. Tick each box when it passes.

**How to run:** open the site locally (`npm run dev`) or your preview URL in a desktop browser (1280px wide or wider for portrait doors).

---

## Story modes

- [ ] **Full story (default):** Homepage hero shows three portrait doors. Platform section heading reads **All platform surfaces**.
- [ ] **Light story:** Use the Story mode toggle in the nav → **Light story**. Heading switches to **Core features** and room chips appear (Clive's study, Doc's workshop, Pam's desk).
- [ ] **No story:** Toggle to **No story** — same flat directory as Light story (no portrait navigation on click).

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

## Regression script (optional)

```bash
npm run test:command-centre
npm run test:e2e
```

Both should pass before you ship.
