#!/usr/bin/env python3
"""Populate Household Skills Script / Script files from HA dumps."""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEED = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11/seed-payload-v0.2.json"
AT_RECORDS = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11/at-skills-records.json"
DOWNLOADS = Path.home() / "Downloads"
OUT_DIR = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11/script-files"
PLAN_OUT = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11/script-populate-plan.json"

FLD_SCRIPT = "fldTDoPCrvcws6IZu"
FLD_SCRIPT_FILES = "fldF1z1dtbiZcWnT6"
FLD_REPO_PATH = "fldFDdSX9HcD3BMgI"

SMALL_FILE = 15_000
SMALL_TOTAL = 20_000
REPO_PATH_PREFIX = "docs/initiatives/household-skills-ssot-2026-08-11/script-files/"


def slugify(s: str) -> str:
    s = s.lower().strip()
    s = re.sub(r"[^a-z0-9]+", "-", s)
    return s.strip("-")


def pick_dump(key: str, source_file: str | None, dump_index: dict[str, list[Path]]) -> Path | None:
    for candidate in (key, Path(source_file or "").stem.replace("skill-", "")):
        if not candidate:
            continue
        paths = dump_index.get(slugify(candidate), [])
        if not paths:
            continue
        plain = [p for p in paths if " (" not in p.stem]
        return sorted(plain or paths, key=lambda p: p.stat().st_mtime, reverse=True)[0]
    return None


def parse_scripts(dump: Path) -> list[dict]:
    data = json.loads(dump.read_text(encoding="utf-8"))
    scripts_raw = data.get("data", {}).get("scripts")
    if not scripts_raw:
        return []
    if isinstance(scripts_raw, str):
        return json.loads(scripts_raw)
    return scripts_raw


def ha_json_string(scripts: list[dict]) -> str:
    payload = [{"filename": s.get("filename"), "content": s.get("content", "")} for s in scripts]
    return json.dumps(payload, ensure_ascii=False)


def upload_public_url(path: Path) -> str | None:
    try:
        boundary = "----AstraJaxBoundary"
        data = path.read_bytes()
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="reqtype"\r\n\r\n'
            f"fileupload\r\n"
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="fileToUpload"; filename="{path.name}"\r\n'
            f"Content-Type: application/octet-stream\r\n\r\n"
        ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
        req = urllib.request.Request(
            "https://catbox.moe/user/api.php",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=120) as resp:
            url = resp.read().decode().strip()
            if url.startswith("http"):
                return url
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"  upload failed for {path.name}: {exc}", file=sys.stderr)
    return None


def load_at_records() -> dict[str, dict]:
    raw = json.loads(AT_RECORDS.read_text(encoding="utf-8"))
    by_slug: dict[str, dict] = {}
    for rec in raw:
        name = rec.get("skillName") or ""
        by_slug[slugify(name)] = rec
    return by_slug


def main() -> int:
    seed = json.loads(SEED.read_text(encoding="utf-8"))
    at_by_slug = load_at_records()

    dump_index: dict[str, list[Path]] = {}
    for p in DOWNLOADS.glob("skill-*.json"):
        key = re.sub(r"\s*\(\d+\)$", "", p.stem[6:])
        dump_index.setdefault(slugify(key), []).append(p)

    stats = {
        "small_to_script": 0,
        "large_to_script_files": 0,
        "large_repo_path_fallback": 0,
        "attachment_upload_ok": 0,
        "attachment_upload_failed": 0,
        "skipped_no_ha": 0,
        "skipped_no_dump": 0,
        "skipped_already": 0,
        "failures": [],
    }
    updates: list[dict] = []

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    for row in seed["rows"]:
        key = row["idempotencyKey"]
        name = row["fields"]["Skill Name"]
        slug = slugify(key)
        if slugify(name) != slug:
            slug_candidates = [slug, slugify(name)]
        else:
            slug_candidates = [slug]

        rec = None
        for s in slug_candidates:
            rec = at_by_slug.get(s)
            if rec:
                break
        if not rec:
            stats["failures"].append({"key": key, "name": name, "reason": "no Airtable record match"})
            continue

        if not row.get("hasScriptsInHA"):
            stats["skipped_no_ha"] += 1
            continue

        existing_script = (rec.get("script") or "").strip()
        existing_files = rec.get("scriptFiles") or []
        if existing_script or existing_files:
            stats["skipped_already"] += 1
            continue

        dump = pick_dump(key, row.get("sourceFile"), dump_index)
        if not dump:
            stats["skipped_no_dump"] += 1
            stats["failures"].append({"key": key, "name": name, "reason": "no HA dump file"})
            continue

        scripts = parse_scripts(dump)
        if not scripts:
            stats["skipped_no_dump"] += 1
            stats["failures"].append({"key": key, "name": name, "reason": "empty scripts in dump"})
            continue

        total = sum(len(s.get("content", "")) for s in scripts)
        max_file = max(len(s.get("content", "")) for s in scripts)
        use_attach = len(scripts) > 1 or max_file > SMALL_FILE or total > SMALL_TOTAL

        fields: dict = {}
        rec_id = rec["id"]

        if not use_attach:
            fields[FLD_SCRIPT] = ha_json_string(scripts)
            stats["small_to_script"] += 1
        else:
            skill_dir = OUT_DIR / key
            skill_dir.mkdir(parents=True, exist_ok=True)
            attachments = []
            for s in scripts:
                fname = s.get("filename") or "script.txt"
                fpath = skill_dir / fname
                fpath.write_text(s.get("content", ""), encoding="utf-8")
                url = upload_public_url(fpath)
                if url:
                    attachments.append({"url": url, "filename": fname})
                    stats["attachment_upload_ok"] += 1
                else:
                    stats["attachment_upload_failed"] += 1

            existing_repo = (rec.get("repoPath") or "").strip()
            if not existing_repo:
                fields[FLD_REPO_PATH] = REPO_PATH_PREFIX + key + "/"

            if attachments:
                fields[FLD_SCRIPT_FILES] = attachments
                stats["large_to_script_files"] += 1
            else:
                fields[FLD_SCRIPT] = (
                    f"[Scripts stored in repo at {REPO_PATH_PREFIX}{key}/ — "
                    f"{len(scripts)} file(s), {total} chars total. "
                    "Attachment upload unavailable via automation; see initiative folder.]"
                )
                stats["large_repo_path_fallback"] += 1

        updates.append({"id": rec_id, "fields": fields, "key": key, "name": name})

    plan = {"stats": stats, "updates": updates}
    PLAN_OUT.write_text(json.dumps(plan, indent=2, ensure_ascii=False), encoding="utf-8")
    print(json.dumps(stats, indent=2))
    print(f"Updates prepared: {len(updates)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
