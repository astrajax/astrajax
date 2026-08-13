#!/usr/bin/env python3
"""Attach latest HyperAgent agent JSON exports from Downloads to Household Register."""

from __future__ import annotations

import json
import re
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DOWNLOADS = Path.home() / "Downloads"
MIRROR = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11/agent-json-mirror"
OUT = ROOT / "docs/initiatives/household-skills-ssot-2026-08-11/agent-json-attach-plan.json"

BASE_ID = "appPrpfvsAr71RPP3"
MEMBERS_TABLE = "tblJ70qtHUc1dUHhi"
MINIONS_TABLE = "tbl6aVm9rgWoOBVfd"
MEMBERS_ATTACH = "fldbnudkuRE74ihfl"
MINIONS_ATTACH = "fldENFLvrgsss9MHJ"

MEMBERS: dict[str, str] = {
    "halvard": "rec4HefXSfE5Crtjd",
    "ristral": "rec4KZKxbIGeJxiNe",
    "horace-farthing": "recIZ5zKLolGy4ggz",
    "pam": "recKeX30nlTTI259K",
    "ruth-hadley": "recNa6Q5FnsqhVyKk",
    "milo-cadence": "recOb1thHGgF6fS7j",
    "lazlo-marlowe": "recOkb1bboSjeEQfu",
    "investing-lane-trade-executor": "recWMToQ4ala97tyi",
    "clive": "recapJchs8Wm5V6I3",
    "kathryn-goodchild": "recd78kNWGdtLVY2f",
    "doc": "recjg5CwbEl5DUEZg",
    "investing-lane-analyst-head": "reclnaa2QmKF9cMIO",
    "clive-man": "reclxxOUDOW6FoztJ",
    "luwani": "recmCew3IIKZHRlS6",
    "kate": "rect31B9mjgphUKfe",
    "skill-forge": "recwZ6NRDqdVurTMJ",
}

MINIONS: dict[str, str] = {
    "clive-man-executor": "rec26uMdaXzMhghVR",
    "external-context-scanner": "rec6WjozJxB8km4Rk",
    "clive-man-ambient-capture": "rec7PtTNAhAZX6ATT",
    "clive-man-challenger": "rec7wUHWrDBwxlY5j",
    "clive-man": "recIJsF8Z3Z4qGnYL",
    "ruth-build-challenger": "recJrMES14yU8yEJF",
    "ruth-build-executor": "recMn2vjw29YKW9HG",
    "clive-man-context-executor": "reccRTyohm8BOwxJX",
    "ruth-maintenance-challenger": "recczqnFmtqgmVeOV",
    "doc-workshop-executor": "recekEdiLJEwn5aUA",
    "doc-workshop-challenger": "recfAcyNFiViZWCVP",
    "clive-man-context-auditor": "recfPjrVRbmG0l3yH",
    "clive-man-proposer": "recj6Hi6DSOafmyhB",
    "clive-man-context-challenger": "recsDPj5MkDEkduys",
    "ruth-maintenance-executor": "rect9hE900vAbUB32",
}

MINION_SUFFIXES = (
    "proposer",
    "challenger",
    "executor",
    "context-auditor",
    "context-challenger",
    "context-executor",
    "ambient-capture",
    "workshop-executor",
    "workshop-challenger",
    "build-challenger",
    "build-executor",
    "maintenance-challenger",
    "maintenance-executor",
    "external-context-scanner",
)


def slugify(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[''`]", "", text)
    text = re.sub(r"[^a-z0-9]+", "-", text)
    return re.sub(r"-+", "-", text).strip("-")


def filename_stem(path: Path) -> str:
    stem = path.stem
    stem = re.sub(r"\s*\(\d+\)$", "", stem)
    if stem.startswith("agent-"):
        stem = stem[6:]
    stem = re.sub(r"-updated$", "", stem)
    return stem


def normalize_file_slug(raw: str) -> str:
    raw = raw.replace("_", "-")
    mappings = {
        "clive-s-man": "clive-man",
        "doc-albright": "doc",
        "doc-s-workshop-executor": "doc-workshop-executor",
        "doc-s-workshop-challenger": "doc-workshop-challenger",
        "pam-portiscue": "pam",
        "prof-halvard-bjornson": "halvard",
        "clive-wigglesworth-esq-ds-platform-coach": "clive",
        "clive-wigglesworth": "clive",
        "skill-forge-astrajax": "skill-forge",
        "external-context-scanner-v0-1": "external-context-scanner",
    }
    for prefix, repl in mappings.items():
        if raw == prefix or raw.startswith(prefix + "-"):
            suffix = raw[len(prefix) :].lstrip("-")
            return repl if not suffix else f"{repl}-{suffix}"
    raw = re.sub(r"-v0-?\d+$", "", raw)
    return raw


def json_name_slug(name: str | None) -> str | None:
    if not name:
        return None
    aliases = {
        "clives-man": "clive-man",
        "clive-wigglesworth": "clive",
        "doc-albright": "doc",
        "pam-portiscue": "pam",
        "prof-halvard-bjornson": "halvard",
        "doc-s-workshop": None,
    }
    s = slugify(name)
    if s in aliases:
        return aliases[s]
    return s


def classify_slug(slug: str, file_slug: str) -> tuple[str, str] | None:
    """Return (kind, register_slug) or None."""
    has_role_suffix = any(
        file_slug.endswith(f"-{suffix}") or file_slug == suffix for suffix in MINION_SUFFIXES
    )
    if has_role_suffix and slug in MINIONS:
        return "minion", slug
    # Head agents win over legacy minion rows that share a slug (e.g. clive-man).
    if slug in MEMBERS:
        return "member", slug
    if slug in MINIONS:
        return "minion", slug
    if slug == "clive-man":
        return "member", slug
    return None


def resolve_agent(path: Path, payload: dict) -> tuple[str, str] | None:
    if payload.get("type") != "agent":
        return None
    file_slug = normalize_file_slug(filename_stem(path))
    json_slug = json_name_slug(payload.get("data", {}).get("name"))

    # Prefer explicit role suffix in filename for minions
    for suffix in MINION_SUFFIXES:
        token = f"-{suffix}"
        if file_slug.endswith(token) or file_slug == suffix:
            candidate = file_slug if file_slug in MINIONS else suffix if suffix in MINIONS else file_slug
            if candidate in MINIONS:
                return "minion", candidate

    for candidate in (file_slug, json_slug):
        if not candidate:
            continue
        hit = classify_slug(candidate, file_slug)
        if hit:
            # Avoid attaching minion-role dumps to a head member, but allow
            # members whose own slug legitimately ends in a role suffix
            # (e.g. investing-lane-trade-executor).
            if (
                hit[0] == "member"
                and any(file_slug.endswith(f"-{s}") for s in MINION_SUFFIXES)
                and hit[1] != file_slug
            ):
                continue
            return hit
    return None


def score_file(path: Path, payload: dict) -> float:
    exported = payload.get("exportedAt")
    if exported:
        try:
            return datetime.fromisoformat(exported.replace("Z", "+00:00")).timestamp()
        except ValueError:
            pass
    return path.stat().st_mtime


def upload_public_url(path: Path) -> str | None:
    try:
        boundary = "----AstraJaxAgentJson"
        data = path.read_bytes()
        body = (
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="reqtype"\r\n\r\n'
            f"fileupload\r\n"
            f"--{boundary}\r\n"
            f'Content-Disposition: form-data; name="fileToUpload"; filename="{path.name}"\r\n'
            f"Content-Type: application/json\r\n\r\n"
        ).encode() + data + f"\r\n--{boundary}--\r\n".encode()
        req = urllib.request.Request(
            "https://catbox.moe/user/api.php",
            data=body,
            headers={"Content-Type": f"multipart/form-data; boundary={boundary}"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=180) as resp:
            url = resp.read().decode().strip()
            if url.startswith("http"):
                return url
    except (urllib.error.URLError, TimeoutError, OSError) as exc:
        print(f"upload failed {path.name}: {exc}", file=sys.stderr)
    return None


def main() -> int:
    candidates: dict[tuple[str, str], dict] = {}
    duplicate_log: list[dict] = []
    skipped: list[dict] = []

    for path in sorted(DOWNLOADS.rglob("agent-*.json")):
        if path.name.startswith("skill-"):
            continue
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (json.JSONDecodeError, OSError) as exc:
            skipped.append({"path": str(path), "reason": str(exc)})
            continue

        resolved = resolve_agent(path, payload)
        if not resolved:
            skipped.append({"path": str(path), "reason": "no register match"})
            continue

        kind, slug = resolved
        key = (kind, slug)
        entry = {
            "path": str(path),
            "filename": path.name,
            "slug": slug,
            "kind": kind,
            "score": score_file(path, payload),
            "exportedAt": payload.get("exportedAt"),
            "json_name": payload.get("data", {}).get("name"),
        }
        prev = candidates.get(key)
        if prev is None or entry["score"] > prev["score"] or (
            entry["score"] == prev["score"] and path.stat().st_mtime > Path(prev["path"]).stat().st_mtime
        ):
            if prev:
                duplicate_log.append(
                    {
                        "slug": slug,
                        "kind": kind,
                        "winner": path.name,
                        "loser": prev["filename"],
                        "winner_exportedAt": entry.get("exportedAt"),
                        "loser_exportedAt": prev.get("exportedAt"),
                    }
                )
            candidates[key] = entry
        else:
            duplicate_log.append(
                {
                    "slug": slug,
                    "kind": kind,
                    "winner": prev["filename"],
                    "loser": path.name,
                    "winner_exportedAt": prev.get("exportedAt"),
                    "loser_exportedAt": entry.get("exportedAt"),
                }
            )

    MIRROR.mkdir(parents=True, exist_ok=True)
    member_updates: list[dict] = []
    minion_updates: list[dict] = []
    upload_failures: list[dict] = []

    for (kind, slug), entry in sorted(candidates.items()):
        src = Path(entry["path"])
        mirror_name = f"{slug}.json"
        mirror_path = MIRROR / mirror_name
        mirror_path.write_bytes(src.read_bytes())

        url = upload_public_url(src)
        if not url:
            upload_failures.append({"slug": slug, "kind": kind, "file": entry["filename"]})
            continue

        record_id = MEMBERS[slug] if kind == "member" else MINIONS[slug]
        attach_field = MEMBERS_ATTACH if kind == "member" else MINIONS_ATTACH
        table_id = MEMBERS_TABLE if kind == "member" else MINIONS_TABLE
        update = {
            "id": record_id,
            "fields": {attach_field: [{"url": url, "filename": entry["filename"]}]},
            "meta": {
                "slug": slug,
                "kind": kind,
                "tableId": table_id,
                "source": entry["filename"],
                "exportedAt": entry.get("exportedAt"),
                "catbox": url,
            },
        }
        if kind == "member":
            member_updates.append(update)
        else:
            minion_updates.append(update)

    missing_members = sorted(set(MEMBERS) - {s for k, s in candidates if k == "member"})
    missing_minions = sorted(set(MINIONS) - {s for k, s in candidates if k == "minion"})

    plan = {
        "baseId": BASE_ID,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "memberUpdates": member_updates,
        "minionUpdates": minion_updates,
        "stats": {
            "members_matched": len([k for k in candidates if k[0] == "member"]),
            "minions_matched": len([k for k in candidates if k[0] == "minion"]),
            "members_uploaded": len(member_updates),
            "minions_uploaded": len(minion_updates),
            "upload_failures": len(upload_failures),
        },
        "missingMembers": missing_members,
        "missingMinions": missing_minions,
        "duplicateHandling": duplicate_log,
        "uploadFailures": upload_failures,
        "skippedCount": len(skipped),
    }
    OUT.write_text(json.dumps(plan, indent=2), encoding="utf-8")

    print(json.dumps(plan["stats"], indent=2))
    print(f"plan -> {OUT}")
    return 0 if not upload_failures else 1


if __name__ == "__main__":
    raise SystemExit(main())
