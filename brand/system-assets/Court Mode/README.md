# Court Mode

Master assets for Court. **Not served live** — the site reads from
`website/public/agent-cast/court/`.

## Layout

```text
Court Mode/
  book-blank.jpg       → live: court-book-blank.jpg
  judge.mp4            → live: court-judge.mp4 (may differ if re-exported)
  portraits/           → live: court/portraits/*.webp (converted for web)
```

## Live rule

Do not rename or delete files under `website/public/agent-cast/court/` without
updating `website/src/lib/platform/court.ts` and `CourtShell.tsx`.
