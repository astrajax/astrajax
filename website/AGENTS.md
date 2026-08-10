<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Creative media + Blob store

**Catalogue (agents):** Trusted Brain — Creative → **Media Assets** (`BRAIN_TRUSTED_CREATIVE_*` in `src/lib/brains/airtable-ids.ts`). Governance: `docs/business/architecture.md` § Airtable.

**Bytes:** public Vercel Blob store `store_cvu4L5KwtlOCutGD`.

- Agent guide: `docs/website-blob-store.md`
- Schema: `docs/initiatives/brain-key-schema.md` § Media Assets
- Upload script: `scripts/upload-furniture-to-blob.mjs` (furniture); general packs → Blob then Media Assets rows
- Write token: `AJ_WEBSITE_BLOB_READ_WRITE_TOKEN` in `.env.local` only (never commit)
- Legacy Git helpers (`folio-furniture.ts`, `public/agent-cast/…` binaries) are transitional — prefer Media Assets + Blob
