# Slide decks for manual upload

Drag these onto the matching **TL Onboarding** record → **Slides PDF** field in Airtable.

| File | Record title |
|------|----------------|
| `ai-seeds-of-promise.pdf` | **AI in plain English** |

Or run (needs PAT with base access):

```bash
python3 scripts/upload_slides_pdf.py interface-extensions/tl-onboarding/assets-for-upload/ai-seeds-of-promise.pdf --title "AI in plain English"
```

After upload + extension release, the deck embeds inline on that page.
