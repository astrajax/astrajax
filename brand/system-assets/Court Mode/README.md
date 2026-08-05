# Court Mode

Master assets for Court. **Not served live** — the site reads from
`website/public/agent-cast/court/`.

## Layout

```text
Court Mode/
  book-blank-with-holes.png  → live: court-book-blank.png (punched alpha, 4096×2304)
  book-blank.jpg             → live backup: court-book-blank.prev.jpg / .prev.png
  judge.mp4                  → live: court-judge.mp4 (may differ if re-exported)
  portraits/                 → live: court/portraits/*.webp (converted for web)
```

## Live rule

Do not rename or delete files under `website/public/agent-cast/court/` without
updating `website/src/lib/platform/court.ts` and `CourtShell.tsx`.
