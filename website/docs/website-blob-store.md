# Website Blob store — agent access

Public Vercel Blob store for Living Folio masters and furniture plates (dockets, medallions, rules, seals).

## Store

| | |
|---|---|
| Store id | `store_cvu4L5KwtlOCutGD` |
| Env name | `AJ_WEBSITE_BLOB_STORE_ID` |
| Public host | `https://cvu4l5kwtlocutgd.public.blob.vercel-storage.com` |
| Furniture folder | `docket-plate-blob/` |
| Folio masters | `folio/` |
| Clive plate mattes | `folio/masks/` (`clive-folio-deckle-v9-4k.png`, `clive-folio-deckle-ink-v9-4k.png` — teaching approved; interaction TBD) |
| Hal (Bjornson) art | `halvard-bjornson/` (mirrors `public/agent-cast/halvard-bjornson/`) |

**Do not confuse with** `BLOB_STORE_ID` / the private platform-activity lease store (`store_CBBOCfsnLULjDOmx`). That one is leases/outbox only.

## Credentials (local only — never commit)

In `website/.env.local`:

```bash
AJ_WEBSITE_BLOB_STORE_ID=store_cvu4L5KwtlOCutGD
AJ_WEBSITE_BLOB_READ_WRITE_TOKEN=vercel_blob_rw_…   # write/upload token for THIS store
```

Upload scripts also accept `BLOB_READ_WRITE_TOKEN` as a fallback, but prefer `AJ_WEBSITE_BLOB_READ_WRITE_TOKEN` so the private platform store token is not overwritten.

If the token is missing locally: Vercel → Storage → this Blob store → tokens. Put it in `.env.local` only.

## How agents should use assets

**Canonical catalogue (preferred):** Trusted Brain — Creative → **Media Assets** table  
(`appvs1m7kP7lxRwcL` / slug `creative`). Status **Locked** = safe to use. Blob URL on the row is the file home.

1. **Airtable Media Assets** — look up by Asset Key / Character Pack; do not invent paths.
2. **Living Folio master** — still wired via `website/src/lib/folio-assets.ts` + `folio-asset-url.ts` until migrated into Media Assets.
3. **Legacy Git helpers** — `folio-furniture.ts` and upload JSON catalogs are transitional; prefer Creative Media Assets going forward.
4. **Hal pack** — already on Blob under `halvard-bjornson/`; register Locked rows in Media Assets when TL signs finish.

Public URL shape:

```text
https://cvu4l5kwtlocutgd.public.blob.vercel-storage.com/docket-plate-blob/<name>.png
```

## Upload more furniture

From `website/`:

```bash
# Token already in .env.local
node --env-file=.env.local scripts/upload-furniture-to-blob.mjs /path/to/plate.png

# Or a folder of PNGs (filename becomes the Blob key under docket-plate-blob/)
node --env-file=.env.local scripts/upload-furniture-to-blob.mjs /path/to/folder
```

Then update `folio-furniture.ts` with the printed SHA / dimensions (or re-run and paste from the refreshed JSON catalog).

## Rules

- Never commit `AJ_WEBSITE_BLOB_READ_WRITE_TOKEN` or paste it into Git docs.
- Prefer `access: "public"` for UI furniture (served straight to `next/image`).
- Use stable pathnames (`addRandomSuffix: false`, `allowOverwrite: true`) so manifests stay valid.
- Kathryn / Tara-Lee own visual finish for new plates.
