#!/usr/bin/env python3
"""Import ds-platform training videos into Airtable Video Content.

Scans ~/ds-platform/training/videos for .mp4 files, attaches matching ASS
transcripts where present, and creates Video Content rows (idempotent on Video ID).

Requires AIRTABLE_WRITE_TOKEN in repo-root .env.
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
import time
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

VIDEO_ROOT = Path.home() / "ds-platform" / "training" / "videos"
TABLE_NAME = "Video Content"
BATCH_SIZE = 10

SYSTEM_LABELS = {
    "abs": "Activity Booking System",
    "ass": "Activity Staffing System",
}


def fail(message: str, code: int = 1) -> None:
    print(json.dumps({"success": False, "error": message}))
    sys.exit(code)


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


def transcript_path(video_path: Path) -> Path | None:
    stem = video_path.stem
    candidates = [
        video_path.parent / "Transcripts" / f"{stem}.txt",
        video_path.with_suffix(".txt"),
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


def human_title(stem: str) -> str:
    parts = stem.split("-", 1)
    if len(parts) == 2 and parts[0] in SYSTEM_LABELS:
        system = parts[0].upper()
        body = parts[1].replace("-", " ")
        body = re.sub(r"\b([a-z])", lambda m: m.group(1).upper(), body)
        body = re.sub(r"\bBa\b", "BA", body)
        body = re.sub(r"\bCpa\b", "CPA", body)
        return f"{system}: {body}"
    return stem.replace("-", " ").title()


def existing_video_ids() -> set[str]:
    records = list_records(TABLE_NAME, fields=["Video ID"], max_records=100)
    return {
        record["fields"]["Video ID"]
        for record in records
        if record.get("fields", {}).get("Video ID")
    }


def build_record(video_path: Path) -> dict[str, Any]:
    stem = video_path.stem
    system = stem.split("-", 1)[0] if "-" in stem else "unknown"
    transcript_file = transcript_path(video_path)
    transcript_text = transcript_file.read_text(encoding="utf-8").strip() if transcript_file else ""
    seconds = duration_seconds(video_path)

    fields: dict[str, Any] = {
        "Title": human_title(stem),
        "Video ID": stem,
        "Platform": "Local file",
        "Owner": "Matthew",
        "Audience": ["Internal team"],
        "Content Role": ["Training"],
        "Funnel Stage": "Internal",
        "Publish Status": "Internal only",
        "Rights Status": "Licensed",
        "Sensitivity": "Internal",
        "Scanner Status": "New",
        "Review Notes": f"Local path: {video_path}",
    }

    if seconds is not None:
        fields["Length Seconds"] = seconds
        fields["Length"] = seconds

    if transcript_text:
        fields["Transcript Source"] = "Manual"
        fields["Transcript"] = transcript_text
        fields["Transcript Confidence"] = "High"
    else:
        fields["Transcript Confidence"] = "Unknown"

    if system in SYSTEM_LABELS:
        fields["Review Notes"] = (
            f"{SYSTEM_LABELS[system]}. Local path: {video_path}"
        )

    return {"fields": fields}


def create_batch(records: list[dict[str, Any]]) -> list[str]:
    result = request_json(
        "POST",
        table_id(TABLE_NAME),
        data={"records": records},
        token_role="write",
    )
    return [record["id"] for record in result.get("records", [])]


def main() -> None:
    load_dotenv()
    token_for_role("write")

    if not VIDEO_ROOT.exists():
        fail(f"Video root not found: {VIDEO_ROOT}")

    videos = sorted(VIDEO_ROOT.rglob("*.mp4"))
    if not videos:
        fail(f"No .mp4 files found under {VIDEO_ROOT}")

    seen = existing_video_ids()
    to_create: list[dict[str, Any]] = []
    skipped = 0

    for video_path in videos:
        stem = video_path.stem
        if stem in seen:
            skipped += 1
            continue
        to_create.append(build_record(video_path))

    created_ids: list[str] = []
    for index in range(0, len(to_create), BATCH_SIZE):
        batch = to_create[index : index + BATCH_SIZE]
        created_ids.extend(create_batch(batch))
        time.sleep(0.25)

    print(
        json.dumps(
            {
                "success": True,
                "video_root": str(VIDEO_ROOT),
                "discovered": len(videos),
                "created": len(created_ids),
                "skipped_existing": skipped,
                "table_id": table_id(TABLE_NAME),
                "base_id": BASE_ID,
                "record_ids": created_ids,
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
