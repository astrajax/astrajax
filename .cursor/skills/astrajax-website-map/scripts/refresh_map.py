#!/usr/bin/env python3
"""Refresh the astrajax/astrajax website repo map in ONE API call.

Fetches the full recursive git tree, filters to website/, and prints a
grouped, annotated map ready to paste into the astrajax-website-map skill
documentation. Also flags repo hygiene issues (macOS " 2" duplicate files,
committed build artifacts).

Auth: needs GITHUB_TOKEN (fine-grained PAT, Contents: Read on
astrajax/astrajax) injected via RunWithCredentials. Without it, private-repo
access fails and the script says so plainly rather than guessing.
"""

import json
import os
import sys
import urllib.request

OWNER = "astrajax"
REPO = "astrajax"
BRANCH = os.environ.get("REPO_BRANCH", "main")
ROOT = "website/"

NOISE = (
    "node_modules/",
    "website/test-results/",
    "website/.next/",
)
NOISE_FILES = (
    "website/package-lock.json",
    "website/tsconfig.tsbuildinfo",
)


def fetch_tree():
    url = f"https://api.github.com/repos/{OWNER}/{REPO}/git/trees/{BRANCH}?recursive=1"
    req = urllib.request.Request(url)
    req.add_header("Accept", "application/vnd.github+json")
    token = os.environ.get("GITHUB_TOKEN")
    if token:
        req.add_header("Authorization", f"Bearer {token}")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.load(resp)
    except urllib.error.HTTPError as e:
        print(json.dumps({
            "success": False,
            "error": f"GitHub API {e.code} on {url}. "
                     + ("No GITHUB_TOKEN in env — private repo needs the skill credential."
                        if not token else "Token present — check its Contents:Read scope on this repo."),
        }))
        sys.exit(1)


def main():
    data = fetch_tree()
    if data.get("truncated"):
        print("WARNING: tree truncated by API; map may be incomplete.\n")

    entries = [
        e for e in data.get("tree", [])
        if e["path"].startswith(ROOT)
        and e["type"] == "blob"
        and not any(n in e["path"] for n in NOISE)
        and e["path"] not in NOISE_FILES
    ]

    groups = {}
    dupes = []
    for e in entries:
        rel = e["path"][len(ROOT):]
        top = rel.split("/")[0] if "/" in rel else "(root)"
        groups.setdefault(top, []).append(e)
        if " 2." in e["path"]:
            dupes.append(e["path"])

    print(f"# website/ map — {OWNER}/{REPO}@{BRANCH} "
          f"({len(entries)} files, refreshed via git/trees)\n")

    # Full detail for source code; summary for assets.
    detail_groups = {"src", "(root)", "scripts", "docs", "e2e"}
    for top in sorted(groups):
        files = groups[top]
        total_kb = sum(f.get("size", 0) for f in files) / 1024
        print(f"## {top}/ — {len(files)} files, {total_kb:,.0f} KB")
        if top in detail_groups:
            for f in sorted(files, key=lambda x: x["path"]):
                print(f"  {f['path'][len(ROOT):]}  ({f.get('size', 0):,} B)")
        else:
            subdirs = {}
            for f in files:
                rel = f["path"][len(ROOT) + len(top) + 1:]
                sub = rel.split("/")[0] if "/" in rel else "(files)"
                subdirs.setdefault(sub, [0, 0])
                subdirs[sub][0] += 1
                subdirs[sub][1] += f.get("size", 0)
            for sub, (n, size) in sorted(subdirs.items()):
                print(f"  {sub}/  — {n} files, {size/1024:,.0f} KB")
        print()

    if dupes:
        print("## HYGIENE FLAGS — probable accidental macOS duplicates:")
        for d in dupes:
            print(f"  {d}")


if __name__ == "__main__":
    main()
