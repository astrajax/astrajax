#!/usr/bin/env python3
"""Create or update the Video Content table in the AstraJax Airtable base.

Source library for Matthew's video content: transcripts, metadata, website fit,
and links back to the Clive context pipeline. Raw transcripts are evidence;
approved claims live in Context Items.

Requires AIRTABLE_WRITE_TOKEN in repo-root .env.
"""

from __future__ import annotations

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parent))
from context_architecture_common import (  # noqa: E402
    REPO_ROOT,
    SCHEMA_PATH,
    load_dotenv,
    meta_request_json,
    table_id,
    token_for_role,
)

TABLE_NAME = "Video Content"

PLATFORMS = ["YouTube", "Vimeo", "Loom", "Local file", "Other"]
OWNERS = ["Matthew", "TL", "Unassigned"]
TRANSCRIPT_SOURCES = ["Manual", "Whisper", "YouTube auto", "Other"]
TRANSCRIPT_CONFIDENCE = ["High", "Medium", "Low", "Unknown"]
AUDIENCES = [
    "Founder",
    "Commercial leader",
    "Client prospect",
    "Internal team",
    "General public",
]
WEBSITE_SECTIONS = [
    "Hero",
    "Founder proof",
    "Problem",
    "Method",
    "Proof",
    "Adoption",
    "Offers",
    "Clive",
    "Audit CTA",
]
FUNNEL_STAGES = ["Awareness", "Consideration", "Decision", "Retention", "Internal"]
CONTENT_ROLES = [
    "Proof clip",
    "Explainer",
    "Testimonial",
    "Method walkthrough",
    "Brand story",
    "Training",
    "B-roll",
]
PUBLISH_STATUSES = ["Draft", "Internal only", "Website ready", "Published", "Archived"]
RIGHTS_STATUSES = ["Owned", "Licensed", "Fair use review", "Restricted", "Unknown"]
SENSITIVITY = ["Public", "Internal", "Confidential", "Client-sensitive"]
SCANNER_STATUSES = ["New", "Reviewed", "Promoted", "Ignored"]


def select_options(values: list[str]) -> dict[str, Any]:
    return {"choices": [{"name": value} for value in values]}


def field(name: str, field_type: str, options: dict[str, Any] | None = None) -> dict[str, Any]:
    payload: dict[str, Any] = {"name": name, "type": field_type}
    if options is not None:
        payload["options"] = options
    return payload


def get_meta_tables() -> dict[str, Any]:
    data = meta_request_json("GET", "tables")
    return {table["name"]: table for table in data.get("tables", [])}


def ensure_table() -> dict[str, Any]:
    tables = get_meta_tables()
    if TABLE_NAME in tables:
        return tables[TABLE_NAME]

    payload = {
        "name": TABLE_NAME,
        "description": (
            "Source library for Matthew's video content: transcripts, metadata, "
            "website fit, and links to the Clive context pipeline. Raw transcripts "
            "are evidence; approved claims live in Context Items."
        ),
        "fields": [
            field("Title", "singleLineText"),
            field("Video ID", "singleLineText"),
            field("Source URL", "url"),
            field("Platform", "singleSelect", select_options(PLATFORMS)),
            field("Recorded Date", "date", {"dateFormat": {"name": "iso"}}),
            field("Owner", "singleSelect", select_options(OWNERS)),
            field("Length Seconds", "number", {"precision": 0}),
            field("Length", "duration", {"durationFormat": "h:mm:ss"}),
            field("Embed URL", "url"),
            field("Transcript Source", "singleSelect", select_options(TRANSCRIPT_SOURCES)),
            field("Transcript", "multilineText"),
            field("AI Summary", "multilineText"),
            field("Key Claims", "multilineText"),
            field("Notable Quotes", "multilineText"),
            field("Transcript Confidence", "singleSelect", select_options(TRANSCRIPT_CONFIDENCE)),
            field("Audience", "multipleSelects", select_options(AUDIENCES)),
            field("Website Section", "multipleSelects", select_options(WEBSITE_SECTIONS)),
            field("Funnel Stage", "singleSelect", select_options(FUNNEL_STAGES)),
            field("Content Role", "multipleSelects", select_options(CONTENT_ROLES)),
            field("Publish Status", "singleSelect", select_options(PUBLISH_STATUSES)),
            field("Rights Status", "singleSelect", select_options(RIGHTS_STATUSES)),
            field("Sensitivity", "singleSelect", select_options(SENSITIVITY)),
            field("Redaction Needed", "checkbox", {"icon": "check", "color": "greenBright"}),
            field("Last Reviewed", "date", {"dateFormat": {"name": "iso"}}),
            field("Review Notes", "multilineText"),
            field("Scanner Status", "singleSelect", select_options(SCANNER_STATUSES)),
        ],
    }
    meta_request_json("POST", "tables", payload)
    time.sleep(0.5)
    tables = get_meta_tables()
    return tables[TABLE_NAME]


def ensure_field(table: dict[str, Any], field_def: dict[str, Any]) -> None:
    if any(existing["name"] == field_def["name"] for existing in table.get("fields", [])):
        return
    meta_request_json("POST", f"tables/{table['id']}/fields", field_def)
    time.sleep(0.3)


def ensure_link_fields(table: dict[str, Any]) -> dict[str, Any]:
    link_fields = [
        field(
            "Related Intake",
            "multipleRecordLinks",
            {"linkedTableId": table_id("Context Intake")},
        ),
        field(
            "Related Context Items",
            "multipleRecordLinks",
            {"linkedTableId": table_id("Context Items")},
        ),
        field("Thumbnail", "multipleAttachments"),
    ]
    for field_def in link_fields:
        ensure_field(table, field_def)
        table = get_meta_tables()[TABLE_NAME]
    return table


def refresh_schema(table: dict[str, Any]) -> None:
    schema = json.loads(SCHEMA_PATH.read_text(encoding="utf-8"))
    fields: dict[str, Any] = {}
    for item in table.get("fields", []):
        fields[item["name"]] = {
            "id": item["id"],
            "name": item["name"],
            "type": item["type"],
        }

    schema.setdefault("tables", {})[TABLE_NAME] = {
        "id": table["id"],
        "name": TABLE_NAME,
        "fields": fields,
        "note": (
            "Source library for video transcripts and website selection. "
            "Approved claims flow through Context Intake and Context Items."
        ),
    }

    allowed = schema.setdefault("allowed_values", {})
    allowed["video_platforms"] = PLATFORMS
    allowed["video_transcript_sources"] = TRANSCRIPT_SOURCES
    allowed["video_transcript_confidence"] = TRANSCRIPT_CONFIDENCE
    allowed["video_audiences"] = AUDIENCES
    allowed["video_website_sections"] = WEBSITE_SECTIONS
    allowed["video_funnel_stages"] = FUNNEL_STAGES
    allowed["video_content_roles"] = CONTENT_ROLES
    allowed["video_publish_statuses"] = PUBLISH_STATUSES
    allowed["video_rights_statuses"] = RIGHTS_STATUSES
    allowed["video_sensitivity"] = SENSITIVITY
    allowed["video_scanner_status"] = SCANNER_STATUSES

    schema["generated_at"] = datetime.now(timezone.utc).isoformat()
    SCHEMA_PATH.write_text(json.dumps(schema, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def main() -> None:
    load_dotenv()
    token_for_role("write")
    table = ensure_table()
    table = ensure_link_fields(table)
    refresh_schema(table)
    print(
        json.dumps(
            {
                "success": True,
                "table_id": table["id"],
                "table_name": TABLE_NAME,
                "field_count": len(table.get("fields", [])),
                "schema_path": str(SCHEMA_PATH.relative_to(REPO_ROOT)),
                "next_step": "Load a small batch of real videos and create Airtable views for website selection.",
            },
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
