# AstraJax Interface Extensions — setup (canonical)

Follow the **ds-platform** pattern (`Interface_Extensions/ec-period-dashboard`, `salesperson-dashboard`, `bot-fleet`). Same mental model as Butternut: **repo code → `block release` → existing block on the Interface page → Data access in Designer**.

**Base:** `appYv601Oq7fKTCj0`

---

## Extension audit (May 2026)

| Extension | Folder | Block linked? | Typecheck | Release ready? | Airtable wired? |
|-----------|--------|---------------|-----------|----------------|-----------------|
| Context Intake | `clive-context-intake/` | ✅ `blkd8JWthJb4UKiHL` | ✅ | ✅ `block release` | You wire page + Data |
| Context Items Review | `clive-context-items/` | ✅ `blkPAJw91ne3ACEHo` | ✅ | ✅ `block release` ×2 | You wire page + Data |
| Clive Workbench | `clive-context-workbench/` | ✅ `blkN9GDiYsKhWjLzJ` | ✅ | ✅ `block release` ×2 | You wire page + Data |
| TL Onboarding | `tl-onboarding/` | ✅ `blk9JtMMGag4zzehx` | ✅ | ✅ `block release` | Page `pagdg8ciA7vQswXrs` |
| Email Inbox | `email-inbox/` | ⏳ create block in Airtable | ✅ | ready after link | You wire page + Data |

Per-extension field lists: each folder's `README.md`.

---

## The mistake that causes Hello world 🚀

| Wrong | Right |
|-------|--------|
| "Build an extension" and code in the browser editor | Code in **this repo**; Airtable hosts the **released bundle** |
| `block init` scaffold in `~/hello-world` | Work in `interface-extensions/<name>/` |
| New block ID every time | **One block ID per extension** in `.block/remote.json` |
| Only extension properties (cog) | Also **Interface Designer → extension → Data** (tables + exposed fields) |
| Preview inside the code editor | **Live Interface page** after `block release` + Cmd+Shift+R |

Hello world = wrong block, code editor preview, or release not run from repo.

---

## One-time: link repo folder to Airtable block

1. AstraJax → **Interfaces** → add **Extension** → **Build a custom extension** (once per extension).
2. Copy block ID from URL: `appYv601Oq7fKTCj0/blkXXXXXXXX`.
3. From the extension folder:

```bash
cd interface-extensions/<name>
npx block add-remote appYv601Oq7fKTCj0/blkXXXXXXXX default
```

Creates `.block/remote.json`:

```json
{
    "blockId": "blkXXXXXXXX",
    "baseId": "NONE"
}
```

**Always use `"baseId": "NONE"`** on the default remote (tl-onboarding / ds-platform rule). Wrong baseId → release hits wrong API → Hello world persists.

4. Optional: `.block/astrajax.remote.json` with real baseId → `npx block release --remote astrajax`
5. Once: `npx block set-api-key` (PAT with **block:manage**).

---

## Every code change

```bash
cd interface-extensions/<name>
npm run typecheck
npx block release
```

Hard-refresh the **Interface page** (not the code editor).

---

## Wire the page (two layers — both required)

### Layer 1 — Extension properties (cog)

Table pickers from `frontend/index.tsx` → `getCustomProperties`.

### Layer 2 — Interface Designer → extension element → **Data**

Add each source table. **Expose fields** the extension reads (hidden OK). Missing fields → blank cards or "awaiting source". Writes need expose + **edit** permission.

---

## Clive Interface page (suggested layout)

| Page / element | Extension | Block |
|----------------|-----------|-------|
| Context Intake | `clive-context-intake` | `blkd8JWthJb4UKiHL` |
| Clive Workbench | `clive-context-workbench` | `blkN9GDiYsKhWjLzJ` |
| Context Items Review | `clive-context-items` | `blkPAJw91ne3ACEHo` |
| TL Onboarding | `tl-onboarding` | `blk9JtMMGag4zzehx` |
| Email Inbox | `email-inbox` | create in Airtable → link via `block add-remote` |

One extension element per block. Do not reuse a Hello world scaffold block for a different folder.

---

## Local dev

```bash
cd interface-extensions/<name>
npx block run
```

---

## DS reference (Matthew's pattern)

- `~/ds-platform/Interface_Extensions/ec-period-dashboard/docs/ec-extension-map.md`
- `~/ds-platform/Interface_Extensions/salesperson-dashboard/README.md` — **Designer → Data** + field list
- `~/ds-platform/Interface_Extensions/bot-fleet/README.md` — blockId + data access troubleshooting
