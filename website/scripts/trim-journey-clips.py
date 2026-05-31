#!/usr/bin/env python3
"""Trim journey clips from astrajax-journey-video-edit-guide-2026-05-31.md sources."""

from __future__ import annotations

import json
import subprocess
import sys
from dataclasses import asdict, dataclass
from pathlib import Path

FFMPEG = "/opt/homebrew/bin/ffmpeg"
FFPROBE = "/opt/homebrew/bin/ffprobe"

TALK = Path(
    "/Users/matthewhopkinson/Downloads/"
    "Butternut Box： Building an AI-Powered Sales Operation from the Ground Up.mp4"
)
AIRSPACE = Path(
    "/Users/matthewhopkinson/Downloads/HORZ_airspace-la-butternut-airtable-intv_v1.mp4"
)
DS = Path("/Users/matthewhopkinson/ds-platform/training/videos")
ACT3 = Path("/Users/matthewhopkinson/Documents/Forecasting-&-Act3")

OUT = Path(__file__).resolve().parents[1] / "public" / "video" / "journey-clips"


@dataclass
class Clip:
    id: str
    folder: str
    source: str
    start: str
    end: str
    purpose: str
    timeline: str = ""


def parse_ts(ts: str) -> float:
    ts = ts.strip().replace("around ", "")
    parts = ts.split(":")
    if len(parts) == 2:
        return int(parts[0]) * 60 + float(parts[1])
    if len(parts) == 3:
        return int(parts[0]) * 3600 + int(parts[1]) * 60 + float(parts[2])
    raise ValueError(f"Bad timestamp: {ts!r}")


def slug(s: str) -> str:
    keep = []
    for ch in s.lower():
        if ch.isalnum():
            keep.append(ch)
        elif ch in " -_":
            keep.append("-")
    out = "".join(keep)
    while "--" in out:
        out = out.replace("--", "-")
    return out.strip("-")[:80]


def cut(source: Path, start: str, end: str, dest: Path) -> None:
    if not source.exists():
        raise FileNotFoundError(source)
    t0 = parse_ts(start)
    t1 = parse_ts(end)
    if t1 <= t0:
        raise ValueError(f"end must be after start: {start} -> {end}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    cmd = [
        FFMPEG,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-ss",
        f"{t0:.3f}",
        "-i",
        str(source),
        "-t",
        f"{t1 - t0:.3f}",
        "-c:v",
        "libx264",
        "-crf",
        "20",
        "-preset",
        "fast",
        "-c:a",
        "aac",
        "-b:a",
        "128k",
        "-movflags",
        "+faststart",
        str(dest),
    ]
    subprocess.run(cmd, check=True)


def concat(sources: list[Path], dest: Path) -> None:
    list_file = dest.with_suffix(".txt")
    lines = [f"file '{p.resolve()}'" for p in sources]
    list_file.write_text("\n".join(lines) + "\n", encoding="utf-8")
    cmd = [
        FFMPEG,
        "-y",
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "concat",
        "-safe",
        "0",
        "-i",
        str(list_file),
        "-c",
        "copy",
        str(dest),
    ]
    subprocess.run(cmd, check=True)
    list_file.unlink(missing_ok=True)


def build_clips() -> list[Clip]:
    clips: list[Clip] = []

    def talk(
        cid: str,
        start: str,
        end: str,
        purpose: str,
        timeline: str = "",
        folder: str = "talk",
    ) -> None:
        clips.append(Clip(cid, folder, str(TALK), start, end, purpose, timeline))

    def demo(
        cid: str,
        path: Path,
        start: str,
        end: str,
        purpose: str,
        timeline: str = "",
    ) -> None:
        clips.append(Clip(cid, "demos", str(path), start, end, purpose, timeline))

    # §14 — build first
    talk("p01-hero-opener", "00:13", "01:02", "Hero opener", "Hero / Intro")
    talk("p02-thesis", "01:46", "02:10", "AstraJax thesis", "Intro · 2")
    talk("p03-problem", "07:01", "07:21", "Problem statement", "The problem")
    talk("p04-boring-layer", "08:47", "09:12", "Boring layer / OS shift", "Boring layer")
    talk("p05-event-after", "11:13", "12:37", "Event interface after", "Demo 01")
    talk("p06-staffing-after", "14:15", "16:03", "Staffing after + sludge", "Demo 02")
    talk("p07-forecasting", "17:53", "19:33", "Forecasting + labour model", "Demo 03")
    talk("p08-foundation-agents", "21:28", "22:59", "Foundation to agent layer", "Agent intro")
    talk("p09-clive-adoption", "26:36", "27:39", "Clive / personality / adoption", "Demo 04")
    talk("p10-reggie", "30:11", "31:04", "Reggie", "Demo 05")
    talk("p11-trinity", "31:56", "33:07", "Trinity", "Demo 06")
    talk("p12-final-close", "36:09", "36:24", "Final close", "Final lesson")

    # §3 — hero montage segments
    talk("hero-01-authority", "00:13", "00:28", "Anti-authority hook", "Hero montage 1")
    talk("hero-02-no-code", "00:31", "00:59", "Non-technical founder proof", "Hero montage 2")
    talk("hero-03-thesis", "01:46", "02:10", "Thesis", "Hero montage 3")
    talk("hero-04-problem", "07:01", "07:21", "Problem", "Hero montage 4")
    talk("hero-05-boring-layer", "08:47", "09:12", "Boring layer", "Hero montage 5")

    # §13 — full page flow (longer blocks)
    talk("flow-intro-hook", "00:13", "01:02", "Intro hook", "§13.1")
    talk("flow-scale", "04:28", "05:05", "Scale / context", "§13.3")
    talk("flow-breaking-point", "07:51", "08:14", "Sheets 10M-cell breaking point", "§13.5")
    talk("flow-event-before", "10:20", "10:37", "Event before-state", "§13.7 before")
    talk("flow-staffing-block", "12:43", "16:03", "Staffing before/after/button", "§13.8")
    talk("flow-forecasting-block", "17:05", "19:33", "Forecasting block", "§13.9")
    talk("flow-outcomes", "20:21", "21:58", "Outcomes", "§13.10")
    talk("flow-clive-block", "26:36", "28:52", "Clive block", "§13.12")
    talk("flow-compounding", "33:42", "33:58", "Compounding", "§13.15")
    talk("flow-final-lesson", "34:26", "36:24", "Trust → close", "§13.16")

    # Best singles called out in the guide
    talk("best-problem-tools", "06:15", "06:24", "Tools did not talk", "Problem B-roll")
    talk("best-problem-burnout", "06:28", "06:57", "Cracks / burnout risk", "Problem B-roll")
    talk("best-event-ai-human", "12:16", "12:37", "AI first pass / human confirms", "Demo 01")
    talk("best-staffing-lock", "15:49", "16:03", "Lock shifts / sludge removed", "Demo 02")
    talk("best-forecast-engine", "17:05", "17:36", "Forecast engine", "Demo 03")
    talk("best-outcomes", "21:28", "21:58", "Outcomes single", "Outcomes")
    talk("best-agent-layer", "22:33", "22:59", "Agent layer single", "Agent intro")
    talk("best-reggie-strategic", "30:48", "31:04", "Reggie strategic", "Demo 05")
    talk("best-trinity-marcel", "32:31", "33:07", "Marcel executes + audit", "Demo 06")

    # Screen recordings — guide trims
    demo(
        "demo-dashboard-tooltips",
        DS / "abs/abs-ops-dashboard-tooltips.mp4",
        "00:48",
        "01:03",
        "Missing data / prioritised gaps",
        "Demo 01",
    )
    demo(
        "demo-parsing-emails",
        DS / "abs/abs-ops-parsing-data-from-emails.mp4",
        "00:29",
        "00:44",
        "AI suggested updates from organiser email",
        "Demo 01",
    )
    demo(
        "demo-parsing-emails-trinity-fallback",
        DS / "abs/abs-ops-parsing-data-from-emails.mp4",
        "00:01",
        "00:16",
        "Trinity fallback link/suggest",
        "Demo 06",
    )
    demo(
        "demo-staffing-drag-drop",
        DS / "ass/ass-s01-staff-five-open-shifts.mp4",
        "02:00",
        "02:15",
        "Drag-and-drop assignment",
        "Demo 02",
    )
    demo(
        "demo-staffing-lock-confetti",
        DS / "ass/ass-s06-communicating-shifts-to-salespeople.mp4",
        "00:14",
        "00:29",
        "Lock schedule / confetti / emails",
        "Demo 02",
    )
    demo(
        "demo-forecast-qa",
        DS / "abs/abs-forecast-qa-flow.mp4",
        "00:22",
        "00:37",
        "Category and reps vs BAs",
        "Demo 03",
    )
    demo(
        "demo-forecasting-broll",
        ACT3 / "FORECASTING.mp4",
        "00:00",
        "00:15",
        "Forecasting visual B-roll",
        "Demo 03",
    )
    demo(
        "demo-clive-interface",
        DS / "abs/abs-ops-clive-in-airtable.mp4",
        "00:09",
        "00:24",
        "Clive in interface",
        "Demo 04",
    )
    demo(
        "demo-clive-reasoning",
        DS / "abs/abs-ops-clive-in-airtable.mp4",
        "00:52",
        "01:10",
        "Clive reasoning / anomaly follow-up",
        "Demo 04",
    )
    demo(
        "demo-reggie-bonus",
        ACT3 / "MY-GUY-REGGIE.mp4",
        "00:00",
        "00:15",
        "Reggie bonus flow (visual verify)",
        "Demo 05",
    )
    demo(
        "demo-trinity-full",
        ACT3 / "TRINITY-IN-ACTION.mp4",
        "00:00",
        "00:40",
        "Trinity in Action (full export)",
        "Demo 06",
    )
    demo(
        "demo-airspace-backup",
        AIRSPACE,
        "00:00",
        "00:38",
        "Airspace backup hero / external proof",
        "Hero backup",
    )

    return clips


def main() -> int:
    if not TALK.exists():
        print(f"Missing main talk video: {TALK}", file=sys.stderr)
        return 1

    clips = build_clips()
    manifest: list[dict] = []
    errors: list[str] = []
    hero_parts: list[Path] = []

    for clip in clips:
        start_slug = clip.start.replace(":", "")
        end_slug = clip.end.replace(":", "")
        fname = f"{clip.id}_{start_slug}-{end_slug}.mp4"
        dest = OUT / clip.folder / fname
        entry = {**asdict(clip), "output": str(dest.relative_to(OUT.parent.parent))}

        try:
            cut(Path(clip.source), clip.start, clip.end, dest)
            entry["status"] = "ok"
            entry["duration_s"] = round(parse_ts(clip.end) - parse_ts(clip.start), 2)
            if clip.id.startswith("hero-0"):
                hero_parts.append(dest)
        except Exception as exc:  # noqa: BLE001
            entry["status"] = "failed"
            entry["error"] = str(exc)
            errors.append(f"{clip.id}: {exc}")

        manifest.append(entry)
        print(f"[{entry['status']}] {clip.id}")

    # 90s hero montage from the five hero segments
    hero_montage = OUT / "hero" / "hero-montage-90s.mp4"
    if len(hero_parts) == 5:
        try:
            concat(hero_parts, hero_montage)
            manifest.append(
                {
                    "id": "hero-montage-90s",
                    "folder": "hero",
                    "source": "concat of hero-01..05",
                    "output": str(hero_montage.relative_to(OUT.parent.parent)),
                    "status": "ok",
                    "purpose": "Recommended 90-second hero montage",
                }
            )
            print("[ok] hero-montage-90s")
        except Exception as exc:  # noqa: BLE001
            errors.append(f"hero-montage-90s: {exc}")
            print(f"[failed] hero-montage-90s: {exc}")

    OUT.mkdir(parents=True, exist_ok=True)
    manifest_path = OUT / "manifest.json"
    manifest_path.write_text(
        json.dumps(
            {
                "generated": "2026-05-31",
                "main_talk_source": str(TALK),
                "note": (
                    "Timestamps match the full Downloads talk MP4 (~36m), "
                    "not the short Townhall Section MH.mp4 (~4m41s)."
                ),
                "clips": manifest,
                "errors": errors,
            },
            indent=2,
        ),
        encoding="utf-8",
    )

    readme = OUT / "README.md"
    ok = sum(1 for m in manifest if m.get("status") == "ok")
    readme.write_text(
        f"""# Journey clip exports

Generated from `docs/context/astrajax-journey-video-edit-guide-2026-05-31.md`.

**Main talk source:** `{TALK.name}` (full ~36 minute recording)

| Folder | Contents |
|--------|----------|
| `talk/` | Spoken-story trims from the main talk |
| `demos/` | Screen-recording trims |
| `hero/` | `hero-montage-90s.mp4` (concat of the five hero segments) |

**{ok}** clips exported successfully. See `manifest.json` for per-clip source, in/out, and timeline notes.

Re-run: `python3 website/scripts/trim-journey-clips.py`
""",
        encoding="utf-8",
    )

    print(f"\nWrote {manifest_path}")
    if errors:
        print(f"{len(errors)} error(s) — see manifest.json")
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
