#!/usr/bin/env python3
"""Import explicit local video assets into Airtable Video Content.

Supports exported .mp4 files, companion .txt transcripts, and Screen Studio
project archives (.screenstudio.zip). Idempotent on Video ID.

Requires AIRTABLE_WRITE_TOKEN in repo-root .env.
"""

from __future__ import annotations

import argparse
import json
import re
import subprocess
import sys
import time
import zipfile
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from context_architecture_common import (  # noqa: E402
    BASE_ID,
    list_records,
    request_json,
    table_id,
    token_for_role,
    load_dotenv,
)

TABLE_NAME = "Video Content"
BATCH_SIZE = 10

SYSTEM_LABELS = {
    "abs": "Activity Booking System",
    "ass": "Activity Staffing System",
}

# Optional per-path metadata overrides keyed by filename stem.
ASSET_OVERRIDES: dict[str, dict[str, Any]] = {
    "Townhall Section MH": {
        "title": "Townhall Section — Matthew Hopkinson",
        "video_id": "townhall-section-mh",
        "content_role": ["Brand story", "Proof clip"],
        "audience": ["Commercial leader", "Founder"],
        "website_section": ["Founder proof", "Proof"],
        "rights_status": "Licensed",
        "review_notes_prefix": "Butternut townhall clip.",
    },
    "TRINITY-IN-ACTION": {
        "title": "Trinity in Action",
        "video_id": "trinity-in-action",
        "content_role": ["Proof clip", "Method walkthrough"],
        "audience": ["Client prospect", "Commercial leader"],
        "website_section": ["Method", "Clive"],
        "rights_status": "Owned",
        "review_notes_prefix": "AstraJax agent Trinity pattern demo.",
    },
    "VERA": {
        "title": "Vera",
        "video_id": "vera-agent-demo",
        "content_role": ["Proof clip", "Brand story"],
        "audience": ["Client prospect"],
        "website_section": ["Clive", "Proof"],
        "rights_status": "Owned",
        "review_notes_prefix": "Vera agent personality demo.",
    },
    "weekly-reporting": {
        "title": "Weekly Reporting",
        "video_id": "weekly-reporting",
        "content_role": ["Method walkthrough", "Proof clip"],
        "audience": ["Commercial leader", "Internal team"],
        "website_section": ["Proof"],
        "rights_status": "Licensed",
    },
    "thesalespeopleview1": {
        "title": "The Salespeople View",
        "video_id": "thesalespeopleview1",
        "content_role": ["Method walkthrough", "Training"],
        "audience": ["Commercial leader", "Internal team"],
        "website_section": ["Proof"],
        "rights_status": "Licensed",
    },
    "HORZ_airspace-la-butternut-airtable-intv_v1": {
        "title": "Airspace LA — Butternut Airtable Interview",
        "video_id": "airspace-la-butternut-airtable-intv-v1",
        "content_role": ["Proof clip", "Brand story"],
        "audience": ["Client prospect", "Founder"],
        "website_section": ["Founder proof", "Proof"],
        "rights_status": "Licensed",
        "publish_status": "Draft",
    },
    "Clive-in-action": {
        "title": "Clive in Action",
        "video_id": "clive-in-action-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "audience": ["Client prospect"],
        "website_section": ["Clive", "Method"],
        "rights_status": "Owned",
        "review_notes_prefix": "Screen Studio project — export MP4 when ready.",
    },
    "FORECASTING": {
        "title": "Forecasting",
        "video_id": "forecasting-screenstudio",
        "content_role": ["Method walkthrough", "Proof clip"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
    },
    "OPERATIONS-SYSTEM-PRIOR-STATE11:29:10": {
        "title": "Operations System — Prior State",
        "video_id": "operations-system-prior-state-112910",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
    },
    "OPERATIONS-SYSTEM": {
        "title": "Operations System",
        "video_id": "operations-system-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
    },
    "OUR-GUY-REGGIE": {
        "title": "Our Guy Reggie",
        "video_id": "our-guy-reggie-screenstudio",
        "content_role": ["Proof clip", "Brand story"],
        "website_section": ["Clive", "Proof"],
        "rights_status": "Owned",
    },
    "REPORTING-AT-NATIVE-AI": {
        "title": "Reporting at Native AI Speed",
        "video_id": "reporting-at-native-ai-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof"],
        "rights_status": "Licensed",
    },
    "STAFFING-FLOW-BOLT-ON-CONFETTI-FUN": {
        "title": "Staffing Flow — Bolt-on Confetti",
        "video_id": "staffing-flow-bolt-on-confetti-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Adoption"],
        "rights_status": "Licensed",
    },
    "STAFFING-SYSTEM-NEW-FLOW": {
        "title": "Staffing System — New Flow",
        "video_id": "staffing-system-new-flow-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
    },
    "STAFFING-SYSTEM-PRIOR-STATE": {
        "title": "Staffing System — Prior State",
        "video_id": "staffing-system-prior-state-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
    },
    "TRINITY": {
        "title": "Trinity",
        "video_id": "trinity-screenstudio",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Method", "Clive"],
        "rights_status": "Owned",
    },
}

# Exported MP4/MOV overrides — separate video IDs from Screen Studio project rows.
EXPORT_OVERRIDES: dict[str, dict[str, Any]] = {
    "NEW-STAFFING-FLOW": {
        "title": "New Staffing Flow",
        "video_id": "new-staffing-flow-act2-export",
        "content_role": ["Proof clip", "Method walkthrough"],
        "audience": ["Commercial leader", "Client prospect"],
        "website_section": ["Proof", "Method", "Adoption"],
        "rights_status": "Licensed",
        "review_notes_prefix": "Act 2 export.",
    },
    "ops-system-before": {
        "title": "Operations System — Before",
        "video_id": "ops-system-before-act2-export",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
        "review_notes_prefix": "Act 2 export.",
    },
    "ops-system": {
        "title": "Operations System",
        "video_id": "ops-system-act2-export",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
        "review_notes_prefix": "Act 2 export.",
    },
    "staffing-prior-state": {
        "title": "Staffing — Prior State",
        "video_id": "staffing-prior-state-act2-export",
        "content_role": ["Proof clip", "Method walkthrough"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
        "review_notes_prefix": "Act 2 export.",
    },
    "FORECASTING": {
        "title": "Forecasting",
        "video_id": "forecasting-act3-export",
        "content_role": ["Method walkthrough", "Proof clip"],
        "website_section": ["Proof", "Method"],
        "rights_status": "Licensed",
        "review_notes_prefix": "Act 3 export.",
    },
    "MY-GUY-REGGIE": {
        "title": "My Guy Reggie",
        "video_id": "my-guy-reggie-act3-export",
        "content_role": ["Proof clip", "Brand story"],
        "audience": ["Client prospect"],
        "website_section": ["Clive", "Proof"],
        "rights_status": "Owned",
        "review_notes_prefix": "Act 3 export.",
    },
    "parsing-data-from-emails": {
        "title": "Parsing Data from Emails",
        "video_id": "parsing-data-from-emails",
        "content_role": ["Method walkthrough", "Proof clip"],
        "audience": ["Commercial leader", "Client prospect"],
        "website_section": ["Method", "Proof"],
        "rights_status": "Licensed",
    },
}


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


def slugify(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "video-asset"


def duration_seconds(path: Path) -> int | None:
    try:
        result = subprocess.run(
            ["mdls", "-name", "kMDItemDurationSeconds", str(path)],
            capture_output=True,
            text=True,
            check=False,
        )
        match = re.search(r"kMDItemDurationSeconds = ([0-9.]+)", result.stdout)
        if not match:
            return None
        return int(round(float(match.group(1))))
    except OSError:
        return None


def screen_studio_created_at(path: Path) -> str | None:
    try:
        with zipfile.ZipFile(path) as archive:
            for name in archive.namelist():
                if name.endswith("meta.json") and "__MACOSX" not in name:
                    payload = json.loads(archive.read(name).decode("utf-8"))
                    created = payload.get("json", {}).get("createdAt")
                    if created:
                        return str(created)[:10]
    except (OSError, json.JSONDecodeError, zipfile.BadZipFile):
        return None
    return None


def transcript_for(path: Path) -> tuple[str, str | None]:
    candidates = [
        path.with_suffix(".txt"),
        path.parent / "Transcripts" / f"{path.stem}.txt",
    ]
    for candidate in candidates:
        if candidate.exists() and candidate != path:
            return candidate.read_text(encoding="utf-8").strip(), str(candidate)
    return "", None


def human_title(stem: str) -> str:
    parts = stem.split("-", 1)
    if len(parts) == 2 and parts[0] in SYSTEM_LABELS:
        system = parts[0].upper()
        body = parts[1].replace("-", " ")
        return f"{system}: {body.title()}"
    return stem.replace("-", " ").replace("_", " ").title()


def existing_video_ids() -> set[str]:
    seen: set[str] = set()
    offset: str | None = None
    while True:
        query: dict[str, Any] = {"pageSize": 100, "fields[]": "Video ID"}
        if offset:
            query["offset"] = offset
        result = request_json(
            "GET",
            table_id(TABLE_NAME),
            query=query,
            token_role="read",
        )
        for record in result.get("records", []):
            video_id = record.get("fields", {}).get("Video ID")
            if video_id:
                seen.add(video_id)
        offset = result.get("offset")
        if not offset:
            break
    return seen


def asset_stem(path: Path) -> str:
    name = path.name
    if name.endswith(".screenstudio.zip"):
        return name[: -len(".screenstudio.zip")]
    return path.stem


def override_for(path: Path) -> dict[str, Any]:
    stem = asset_stem(path)
    if path.suffix.lower() in {".mp4", ".mov"} and stem in EXPORT_OVERRIDES:
        return EXPORT_OVERRIDES[stem]
    return ASSET_OVERRIDES.get(stem, {})


def is_exported_video(path: Path) -> bool:
    return path.suffix.lower() in {".mp4", ".mov"}


def build_record(path: Path) -> dict[str, Any]:
    override = override_for(path)
    stem = asset_stem(path)
    is_screen_studio = path.suffix == ".zip" and path.name.endswith(".screenstudio.zip")
    is_video = is_exported_video(path)

    video_id = override.get("video_id") or slugify(stem)
    title = override.get("title") or human_title(stem)
    transcript_text = ""
    transcript_source_path: str | None = None

    if is_video:
        transcript_text, transcript_source_path = transcript_for(path)
        seconds = duration_seconds(path)
        asset_kind = f"Exported {path.suffix.upper().lstrip('.')}"
    elif is_screen_studio:
        seconds = None
        asset_kind = "Screen Studio project (export MP4 when ready)"
    else:
        fail(f"Unsupported asset type: {path}")

    prefix = override.get("review_notes_prefix", "")
    review_bits = [bit for bit in [prefix, asset_kind, f"Local path: {path}"] if bit]
    if transcript_source_path:
        review_bits.append(f"Transcript path: {transcript_source_path}")

    fields: dict[str, Any] = {
        "Title": title,
        "Video ID": video_id,
        "Platform": "Local file",
        "Owner": "Matthew",
        "Audience": override.get("audience", ["Internal team"]),
        "Content Role": override.get("content_role", ["Proof clip"]),
        "Funnel Stage": override.get("funnel_stage", "Internal"),
        "Publish Status": override.get("publish_status", "Internal only"),
        "Rights Status": override.get("rights_status", "Licensed"),
        "Sensitivity": override.get("sensitivity", "Internal"),
        "Scanner Status": "New",
        "Review Notes": " ".join(review_bits),
    }

    website_section = override.get("website_section")
    if website_section:
        fields["Website Section"] = website_section

    if seconds is not None:
        fields["Length Seconds"] = seconds
        fields["Length"] = seconds

    if is_screen_studio:
        created = screen_studio_created_at(path)
        if created:
            fields["Recorded Date"] = created

    if transcript_text:
        fields["Transcript Source"] = "Manual"
        fields["Transcript"] = transcript_text
        fields["Transcript Confidence"] = "High"
    else:
        fields["Transcript Confidence"] = "Unknown"

    return {"fields": fields}


def create_batch(records: list[dict[str, Any]]) -> list[str]:
    result = request_json(
        "POST",
        table_id(TABLE_NAME),
        data={"records": records},
        token_role="write",
    )
    return [record["id"] for record in result.get("records", [])]


def default_paths() -> list[Path]:
    return [
        Path("/Users/matthewhopkinson/Library/CloudStorage/GoogleDrive-matt@butternutbox.com/My Drive/Townhall Section MH.mp4"),
        Path("/Users/matthewhopkinson/Documents/Forecasting-&-Act3/TRINITY-IN-ACTION.mp4"),
        Path("/Users/matthewhopkinson/Documents/Forecasting-&-Act3/VERA.mp4"),
        Path("/Users/matthewhopkinson/Documents/weekly-reporting.mp4"),
        Path("/Users/matthewhopkinson/Documents/thesalespeopleview1.mp4"),
        Path("/Users/matthewhopkinson/Downloads/HORZ_airspace-la-butternut-airtable-intv_v1.mp4"),
        Path("/Users/matthewhopkinson/Documents/Clive-in-action.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/FORECASTING.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/OPERATIONS-SYSTEM-PRIOR-STATE11:29:10.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/OPERATIONS-SYSTEM.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/OUR-GUY-REGGIE.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/REPORTING-AT-NATIVE-AI.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/STAFFING-FLOW-BOLT-ON-CONFETTI-FUN.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/STAFFING-SYSTEM-NEW-FLOW.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/STAFFING-SYSTEM-PRIOR-STATE.screenstudio.zip"),
        Path("/Users/matthewhopkinson/Screen Studio Projects/TRINITY.screenstudio.zip"),
    ]


def main() -> None:
    parser = argparse.ArgumentParser(description="Import local video assets into Video Content.")
    parser.add_argument("paths", nargs="*", help="Asset paths (.mp4 or .screenstudio.zip)")
    args = parser.parse_args()

    load_dotenv()
    token_for_role("write")

    paths = [Path(p).expanduser() for p in args.paths] if args.paths else default_paths()
    missing = [str(path) for path in paths if not path.exists()]
    if missing:
        fail(f"Missing paths: {', '.join(missing)}")

    seen = existing_video_ids()
    to_create: list[dict[str, Any]] = []
    skipped = 0
    planned: list[dict[str, str]] = []

    for path in paths:
        if path.suffix.lower() == ".txt":
            continue
        record = build_record(path)
        video_id = record["fields"]["Video ID"]
        planned.append({"video_id": video_id, "title": record["fields"]["Title"], "path": str(path)})
        if video_id in seen:
            skipped += 1
            continue
        to_create.append(record)
        seen.add(video_id)

    created_ids: list[str] = []
    for index in range(0, len(to_create), BATCH_SIZE):
        batch = to_create[index : index + BATCH_SIZE]
        created_ids.extend(create_batch(batch))
        time.sleep(0.25)

    print(
        json.dumps(
            {
                "success": True,
                "requested": len(paths),
                "created": len(created_ids),
                "skipped_existing": skipped,
                "table_id": table_id(TABLE_NAME),
                "base_id": BASE_ID,
                "assets": planned,
                "record_ids": created_ids,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
