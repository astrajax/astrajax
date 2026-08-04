# Agent Visual Assets

Master character stills for the cast. **Not served live** — the website reads
from `website/public/agent-cast/`.

Copy approved masters into `website/public/...` when you ship; do not rename
live public paths without updating the code that references them.

## Layout

```text
Agent Visual Assets/
  clive/           hero.png, portrait.png
  clives-man/      hero.png, portrait.png
  pam/             hero.png, portrait.png
  doc/             hero.png, portrait.png, minion-one.png, minion-two.png
```

Court masters live in `../Court Mode/` (book, judge, portraits).

## Related brand folders

| Folder | What lives there |
|--------|------------------|
| `Clive's Study/` | Clive gesture / welcome video masters |
| `Brain Assets/` | Brain shrine mood masters |
| `Court Mode/` | Court book, judge, portraits |
| `Doc's Workshop/` | Doc workshop landing masters |
| `Home Landing Page/` | Founding-cast hero loop masters |

## Notes

- `DOC-HEROV2.png` was byte-identical to `DOC-HERO.png` and was removed in the
  2026-08 tidy (kept as `doc/hero.png` only).
- Typo renames: `*-portraite` → `portrait.png`.
