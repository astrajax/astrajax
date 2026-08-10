#!/usr/bin/env node
/**
 * Uploads Living Folio furniture PNGs to the public website Blob store
 * under docket-plate-blob/<name>.png.
 *
 * Prerequisites:
 *   AJ_WEBSITE_BLOB_READ_WRITE_TOKEN (preferred) or BLOB_READ_WRITE_TOKEN
 *   in the environment / website/.env.local
 *
 * Run from website/:
 *   node --env-file=.env.local scripts/upload-furniture-to-blob.mjs <file-or-dir> [...]
 *
 * Prints SHA-256 + dimensions for folio-furniture.ts, and refreshes
 * docs/website-blob-furniture-upload.json.
 */

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { readFile, writeFile, readdir, stat, access } from "node:fs/promises";
import { basename, dirname, extname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { put } from "@vercel/blob";

const __dirname = dirname(fileURLToPath(import.meta.url));
const WEBSITE_ROOT = join(__dirname, "..");
const PREFIX = "docket-plate-blob";
const STORE_ID = "store_cvu4L5KwtlOCutGD";
const CATALOG_PATH = join(WEBSITE_ROOT, "docs", "website-blob-furniture-upload.json");

function token() {
  return (
    process.env.AJ_WEBSITE_BLOB_READ_WRITE_TOKEN ||
    process.env.BLOB_READ_WRITE_TOKEN ||
    ""
  );
}

function logicalName(filename) {
  return filename
    .replace(
      /-[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}(\.png)$/i,
      "$1",
    )
    .toLowerCase();
}

function dims(path) {
  const out = execFileSync("sips", ["-g", "pixelWidth", "-g", "pixelHeight", path], {
    encoding: "utf8",
  });
  return {
    width: Number(out.match(/pixelWidth:\s+(\d+)/)?.[1]),
    height: Number(out.match(/pixelHeight:\s+(\d+)/)?.[1]),
  };
}

async function collectPngs(paths) {
  const files = [];
  for (const p of paths) {
    const s = await stat(p);
    if (s.isDirectory()) {
      const entries = await readdir(p);
      for (const e of entries) {
        if (extname(e).toLowerCase() === ".png") files.push(join(p, e));
      }
    } else if (extname(p).toLowerCase() === ".png") {
      files.push(p);
    } else {
      console.error(`  ✗ skip (not png): ${p}`);
    }
  }
  return files;
}

async function loadCatalog() {
  try {
    await access(CATALOG_PATH);
    return JSON.parse(await readFile(CATALOG_PATH, "utf8"));
  } catch {
    return { storeId: STORE_ID, uploadedAt: null, items: [] };
  }
}

async function main() {
  const tok = token();
  if (!tok) {
    console.error(
      "Missing AJ_WEBSITE_BLOB_READ_WRITE_TOKEN (or BLOB_READ_WRITE_TOKEN).\n" +
        "See website/docs/website-blob-store.md",
    );
    process.exit(1);
  }

  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("Usage: node scripts/upload-furniture-to-blob.mjs <file-or-dir> [...]");
    process.exit(1);
  }

  const files = await collectPngs(args);
  if (files.length === 0) {
    console.error("No PNG files found.");
    process.exit(1);
  }

  const catalog = await loadCatalog();
  const byKey = new Map(catalog.items.map((item) => [item.key, item]));

  for (const filePath of files) {
    const body = await readFile(filePath);
    const name = logicalName(basename(filePath));
    const key = name.replace(/\.png$/i, "");
    const pathname = `${PREFIX}/${name}`;
    const sha = createHash("sha256").update(body).digest("hex");
    const { width, height } = dims(filePath);

    const blob = await put(pathname, body, {
      access: "public",
      addRandomSuffix: false,
      allowOverwrite: true,
      contentType: "image/png",
      token: tok,
    });

    const item = {
      key,
      sourceName: name,
      sourceSha256: sha,
      width,
      height,
      mime: "image/png",
      version: 1,
      blobPathname: pathname,
      url: blob.url,
    };
    byKey.set(key, item);
    console.log(`  ✓ ${key}  ${width}×${height}  ${sha.slice(0, 12)}…`);
    console.log(`    ${blob.url}`);
  }

  const items = [...byKey.values()].sort((a, b) => a.key.localeCompare(b.key));
  const next = {
    storeId: STORE_ID,
    uploadedAt: new Date().toISOString(),
    items,
  };
  await writeFile(CATALOG_PATH, `${JSON.stringify(next, null, 2)}\n`);
  console.log(`\nUploaded ${files.length}. Catalog → docs/website-blob-furniture-upload.json`);
  console.log("Update website/src/lib/folio-furniture.ts if keys/SHAs/dims changed.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
