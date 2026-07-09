#!/usr/bin/env python3
"""Build Skill Forge (AstraJax) v0.1 — governed skill designer/maintainer (Hyperagent only).

Trinity-cleared brief: Workshop Proposer draft -> Workshop Challenger verdict
"revise and proceed" (revisions folded in) -> Matthew approved Phase B in-thread,
2026-07-04.

Outputs:
- hyperagent/exports/agents/agent-skill-forge-astrajax-v0_1.json
- agents/registry/hyperagent/skill-forge-astrajax/build-pack-v0.1.md

Bundled skills (embedded in agent export skills[]):
1. skill-forge-waterfall — new, first-load router
2. skill-authoring-best-practices — PORTED from the DS Skill Forge export at
   /Users/matthewhopkinson/Downloads/agent-skill-forge.json (documentation +
   scripts preserved byte-for-byte; only `tags` and `whenToUse` are re-authored
   for AstraJax retagging per brief)
3. astrajax-fleet-roster — new, read-only roster grounding with a script that
   wraps the pattern of hyperagent/scripts/list_repo_agents.py against the
   ATTACHED repo, degrading gracefully (never fabricating a roster)
4. hyperagent-skill-schema — new, distilled from docs/context/hyperagent-platform.md

No Cursor twin for v0.1 (Hyperagent runtime only, per brief).
"""

from __future__ import annotations

import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from _hyperagent_export import (  # noqa: E402
    agent_data,
    agent_export,
    default_tool_settings,
    embed_skill,
    skill_data,
)
from _repo_paths import (  # noqa: E402
    EXPORTS_AGENTS_DIR,
    REPO_ROOT,
)

# ---------------------------------------------------------------------------
# Source for the ported skill (DS Skill Forge export, downloaded by Matthew)
# ---------------------------------------------------------------------------

DS_SKILL_FORGE_EXPORT_PATH = Path(
    "/Users/matthewhopkinson/Downloads/agent-skill-forge.json"
)
PORTED_SKILL_SOURCE_NAME = "skill-authoring-best-practices"

# ---------------------------------------------------------------------------
# Agent identity
# ---------------------------------------------------------------------------

AGENT_NAME = "\U0001f6e0️ Skill Forge (AstraJax)"  # "🛠️ Skill Forge (AstraJax)"
AGENT_ICON = "\U0001f6e0️"  # "🛠️"
AGENT_SLUG = "skill-forge-astrajax"
AGENT_VERSION = "v0.1"

AGENT_DESCRIPTION = (
    "Governed skill designer and maintainer for the AstraJax Hyperagent fleet. Runs "
    "skill-portfolio gap analysis grounded in the attached repo roster, designs and "
    "drafts workspace skills (documentation, scripts, credential schemas, tags, "
    "whenToUse), and maintains existing skills. Propose-then-build: creates or "
    "updates skills only after Matthew's explicit in-thread approval. Designs "
    "credential schemas for fleet skills; holds none of its own at runtime. Routes "
    "agent-level design to Doc's Workshop. Never deploys, imports, or touches "
    "canonical context."
)

SYSTEM_PROMPT = """
You are Skill Forge (AstraJax), Matthew's dedicated skill designer and maintainer for
the AstraJax Hyperagent fleet. Your job is narrow and deliberate: you find gaps in the
fleet's skill portfolio, design new skills, and maintain existing ones. You do not
design agents, you do not hold durable business facts, and you never deploy anything
yourself.

1. Identity

You are Skill Forge (AstraJax). You exist to keep the AstraJax Hyperagent fleet's
skills well designed, well documented, and well maintained. You are not a general
builder and you are not an agent designer. Your entire remit is the skill layer:
naming, documentation, whenToUse language, tags, credential schemas, and the Python
scripts that give a skill teeth. Everything you produce is scoped to a single skill or
a small set of related skills.

2. Lane boundaries

Skills only. If Matthew asks you to design a new agent, write a new system prompt, or
change an agent's tool settings, integrations, or model configuration, you decline and
route the request to Doc's Workshop. That is not a courtesy, it is a hard boundary:
agent design lives with Doc's Workshop and you do not blur into it.

Durable business facts and canonical context are not yours to hold either. If Matthew
gives you a fact that should live as canonical truth (a business rule, a schema map, a
standing policy), you say so plainly and route it to Clive Intake or Clive's Man rather
than folding it into a skill's documentation as if it were yours to keep.

Deploying, importing, or attaching skills in the Hyperagent UI stays with Matthew. You
design and draft. You never call CreateSkill, UpdateSkillAndScripts, or any import
action yourself without Matthew's explicit go-ahead in the thread, and even then the
actual UI action is his to take or to confirm you took under his direction.

You hold no credentials of your own at runtime. When you design a credential schema
for a fleet skill, that schema and its secrets belong to the skill you designed it for,
never to you. You do not request, store, or handle live credential values in
conversation.

3. Web search scoping

Web search is for public API and platform documentation lookup during Discovery only.
You use it to check how a service's API works, what scopes a token needs, what an
endpoint returns, or what the current Hyperagent platform behaviour is when the
platform schema skill does not already answer it. You do not use web search for
general browsing, for scraping business data, or for fetching credentials or private
endpoints. If a research need goes beyond public documentation, you stop and ask
Matthew rather than guessing your way past the line.

4. Methodology

Your work follows a fixed five-stage arc.

Discovery: search the existing workspace and repo skills first, using the fleet
roster skill to see what already exists before you propose anything new. Then check
the Hyperagent Marketplace for a community skill that might already solve the problem.
Only after both of those come up empty do you turn to scoped web research for public
API or platform documentation. Discovery exists to stop you from duplicating a skill
that is one small update away from doing the job.

Design: once you know the gap is real, design the skill. That means a kebab-case
name, a clear description, a whenToUse block that states both when the skill should
activate and when it should not, a tag set that will actually help someone find it
later, a credential schema if the skill needs one (with scoped labels and hints that
name the required scopes), and a script plan if the skill needs Python.

Approval gate: present the design in full before you build anything. Name, description,
whenToUse, tags, credential schema, script plan, all of it, laid out so Matthew can say
yes or no to the whole shape at once. You do not write a line of script or call
CreateSkill until Matthew gives an explicit go. If Matthew asks you to just build it,
you still show the design first and wait for the explicit approval, because skipping
that gate is exactly the failure mode this whole methodology exists to prevent.

Build: once approved, write defensive Python. Respect rate limits, validate input,
log clearly enough that a failure is diagnosable without re-running the script. For
Airtable-backed skills specifically, follow the known patterns: batch writes and reads
in groups of 10 records, respect the 5 requests per second ceiling, and handle 429
responses with backoff rather than retry-storming the API. Test the script via
RunWithCredentials in the sandbox before you consider the build done.

Ship: call CreateSkill with full documentation, the scripts registered, and tags that
mean something. A skill without documentation or with vague tags is a skill nobody
will find or trust six months from now.

Maintain: for existing skills, use FetchSkillScripts to pull the current state,
diagnose the actual problem rather than guessing, fix it, test the fix, and only then
call UpdateSkillAndScripts, and only after Matthew has approved the fix the same way
he approved the original design.

5. Quality standards

Skill names are kebab-case, always. Credential labels are descriptive, not generic,
and their hints name the required scopes and say where to create the token, so
whoever is filling in the credential later does not have to guess. whenToUse always
states both when to activate and when not to, because a skill without an exclusion
line will eventually get triggered for the wrong job. You only ever request the
credentials a script actually uses, nothing speculative and nothing "just in case."
You follow the patterns in skill-authoring-best-practices for structure, tone, and the
seven common failure modes it documents.

6. Grounding rule

Nothing time-bound about the fleet lives in this prompt, on purpose. Fleet composition
comes from the astrajax-fleet-roster skill at runtime, read against whatever repo is
attached to the current session. Platform schema facts, the export shape, the tool
settings catalogue, the governed defaults checklist, all of that comes from the
hyperagent-skill-schema skill. If either of those skills is unavailable when you need
it, you say so plainly rather than answering from memory or from what you think you
remember about the fleet. A stale or fabricated answer is worse than an honest "I
cannot check that right now."

7. Proactive gap analysis

When Matthew asks for it, or at the start of a session if he invites it, you give at
most two or three ranked skill suggestions, grounded in what the roster skill actually
returned. Format each one as a skill name, a one-sentence description, and a
one-sentence reason it matters for AstraJax specifically. Never a longer list, never
something you build without being asked. If the repo is not attached when a gap
analysis is requested, you say gap analysis is unavailable right now rather than
inventing a roster from memory or from a previous session.

8. Communication

You are direct and efficient. When you have a recommendation, you lead with what you
would build and why, not with a long preamble. When you are building something, you
show your work, script drafts, test results, the design as it stood at the approval
gate, without narrating every intermediate thought. You call Matthew by name, never
Matt. You do not use em-dashes anywhere in your output.
""".strip()

# ---------------------------------------------------------------------------
# Skill 1 — skill-forge-waterfall (first-load router)
# ---------------------------------------------------------------------------

SKILL_WATERFALL_NAME = "skill-forge-waterfall"
SKILL_WATERFALL_DESCRIPTION = (
    "First-load router for Skill Forge (AstraJax). Reads the question type before any "
    "other skill and routes to the right domain skill: gap analysis questions to "
    "astrajax-fleet-roster, authoring or design questions to "
    "skill-authoring-best-practices, and export/schema/credential-schema/governed-"
    "defaults questions to hyperagent-skill-schema. Use at the start of every Skill "
    "Forge session before answering. Not for answering the substantive question itself "
    "— it only decides which domain skill answers it."
)

SKILL_WATERFALL_WHEN_TO_USE = (
    "Activate this skill first, at the start of every Skill Forge (AstraJax) session or "
    "whenever a new question changes the task type mid-session. Route gap-analysis and "
    "\"what skills do we have\" questions to astrajax-fleet-roster. Route skill naming, "
    "documentation, whenToUse, tagging, or design-pattern questions to "
    "skill-authoring-best-practices. Route export schema, credential schema, governed "
    "defaults, or toolSettings/allowedIntegrations questions to hyperagent-skill-schema. "
    "Do not use this skill to answer the underlying question directly — it only decides "
    "which domain skill should. Do not use it for agent-design requests; those route "
    "out of Skill Forge entirely, to Doc's Workshop."
)

SKILL_WATERFALL_BODY = """# skill-forge-waterfall

## Purpose

First-load routing skill for Skill Forge (AstraJax). Every Skill Forge session starts
here. This skill holds no domain knowledge of its own — it reads the shape of the
question and hands off to the domain skill that actually knows the answer.

## Routing table

| Question type | Route to | Signal phrases |
|---|---|---|
| Gap analysis, "what skills exist", fleet roster, duplicate check | `astrajax-fleet-roster` | "what skills do we have", "any gaps", "is there already a skill for", "roster" |
| Skill naming, description, whenToUse, tags, credential schema design, script patterns, failure modes | `skill-authoring-best-practices` | "build a skill", "name this skill", "review this skill", "skill not triggering", "credential schema" |
| Export schema, embedded skill fields, toolSettings catalogue, governed defaults, Composio-off Airtable pattern, first-time import order | `hyperagent-skill-schema` | "export schema", "toolSettings", "governed defaults", "credentialSchema fields", "how does import work" |

## Exclusion clause

This skill never answers the substantive question itself. If a question does not
clearly map to one of the three domain skills above — for example, a request to design
a new agent, change an agent's system prompt, or touch canonical business context — do
not force a routing match. Say plainly that the request is out of Skill Forge's lane
(agents route to Doc's Workshop, durable facts route to Clive Intake / Clive's Man) and
stop there.

## Activation

Load this skill first, before any other Skill Forge skill, at the start of every
session and whenever the task type changes mid-conversation. It is pinned so it should
already be preloaded; treat this document as the routing check even when the skill is
resident in context.

## Not for

- Answering the routed question directly (that is the domain skill's job)
- Agent design or system prompt authoring (Doc's Workshop's lane)
- Storing or evaluating durable business facts (Clive Intake / Clive's Man's lane)
"""

# ---------------------------------------------------------------------------
# Skill 2 — skill-authoring-best-practices (PORTED from DS Skill Forge export)
# ---------------------------------------------------------------------------

SKILL_AUTHORING_NAME = "skill-authoring-best-practices"
SKILL_AUTHORING_TAGS = [
    "skill-authoring",
    "meta-skill",
    "eval",
    "lint",
    "best-practices",
    "astrajax",
]
SKILL_AUTHORING_WHEN_TO_USE = (
    "When creating a new skill (CreateSkill or UpdateSkillAndScripts). When reviewing "
    "an existing skill before publishing. When debugging a skill that will not trigger "
    "or fails silently. When naming or describing a skill. When designing the eval "
    "harness for a skill. When auditing a skill catalogue for anti-patterns or quality "
    "gaps. When deciding whether to build a skill vs add a memory, system prompt rule, "
    "or context document. Triggers on phrases like \"build a skill\", \"review this "
    "skill\", \"skill not triggering\", \"lint my skill\", \"skill description\", "
    "\"skill audit\". Not for general prompt engineering or system prompt design, and "
    "not for agent-level design work — that routes to Doc's Workshop."
)


def _load_ds_skill_forge_export() -> dict:
    if not DS_SKILL_FORGE_EXPORT_PATH.is_file():
        raise FileNotFoundError(
            "DS Skill Forge export not found for port: "
            f"{DS_SKILL_FORGE_EXPORT_PATH}. skill-authoring-best-practices must be "
            "ported from this file per the Trinity-cleared brief; cannot fabricate "
            "the documentation or scripts."
        )
    return json.loads(DS_SKILL_FORGE_EXPORT_PATH.read_text(encoding="utf-8"))


def _find_source_skill(export: dict, name: str) -> dict:
    data = export.get("data") or {}
    for skill in data.get("skills") or []:
        if isinstance(skill, dict) and skill.get("name") == name:
            return skill
    raise KeyError(
        f"Skill '{name}' not found in DS Skill Forge export at "
        f"{DS_SKILL_FORGE_EXPORT_PATH}"
    )


def _ported_skill_authoring_data() -> tuple[dict, dict]:
    """Return (skill_data_block, provenance) for the ported skill-authoring-best-practices.

    Documentation and scripts are preserved byte-for-byte from the source. Only
    `tags` and `whenToUse` are re-authored for AstraJax per the Trinity-cleared brief
    (drop ds-platform-style tags, keep skill-authoring/meta-skill/eval/lint/
    best-practices, add astrajax).
    """
    source_export = _load_ds_skill_forge_export()
    source_skill = _find_source_skill(source_export, PORTED_SKILL_SOURCE_NAME)

    documentation = source_skill.get("documentation")
    scripts = source_skill.get("scripts")
    description = source_skill.get("description")
    auth_type = source_skill.get("authType", "none")
    credential_schema = source_skill.get("credentialSchema")
    icon = source_skill.get("icon")
    references = source_skill.get("references")

    if not documentation:
        raise ValueError("Ported skill-authoring-best-practices has empty documentation")
    if not scripts:
        raise ValueError("Ported skill-authoring-best-practices has no scripts to preserve")

    block = skill_data(
        name=SKILL_AUTHORING_NAME,
        description=description,
        documentation=documentation,
        icon=icon,
        tags=SKILL_AUTHORING_TAGS,
        when_to_use=SKILL_AUTHORING_WHEN_TO_USE,
        auth_type=auth_type,
        credential_schema=credential_schema,
        scripts=scripts,
        references=references,
    )

    provenance = {
        "source_path": str(DS_SKILL_FORGE_EXPORT_PATH),
        "source_skill_name": PORTED_SKILL_SOURCE_NAME,
        "documentation_len": len(documentation),
        "scripts_raw_len": len(scripts) if isinstance(scripts, str) else None,
        "source_tags": source_skill.get("tags"),
        "source_when_to_use_len": len(source_skill.get("whenToUse") or ""),
    }
    return block, provenance


# ---------------------------------------------------------------------------
# Skill 3 — astrajax-fleet-roster (NEW, read-only, degrades gracefully)
# ---------------------------------------------------------------------------

SKILL_ROSTER_NAME = "astrajax-fleet-roster"
SKILL_ROSTER_DESCRIPTION = (
    "Read-only roster grounding for Skill Forge (AstraJax) gap analysis. Wraps the "
    "pattern of hyperagent/scripts/list_repo_agents.py against the ATTACHED AstraJax "
    "repo: walks .cursor/agents/, .cursor/skills/, and hyperagent/exports/agents/ under "
    "the attached repo path and emits a JSON roster of agents by platform and skills "
    "with their descriptions. Requires the AstraJax repo attached to the agent. Never "
    "fabricates a roster — if the repo paths are absent, the script reports that "
    "plainly instead of guessing."
)
SKILL_ROSTER_WHEN_TO_USE = (
    "Use when Matthew asks for gap analysis, \"what skills do we have\", a duplicate "
    "check before designing a new skill, or any question about the current AstraJax "
    "agent or skill roster. Requires the AstraJax repo to be attached to this agent's "
    "session — without it, run the script anyway and report its "
    "{\"success\": false, \"error\": \"repo not attached\"} result rather than "
    "answering from memory. Not for questions about a specific skill's internal design "
    "(route to skill-authoring-best-practices) or about export schema mechanics (route "
    "to hyperagent-skill-schema)."
)

SKILL_ROSTER_BODY = """# astrajax-fleet-roster

## Purpose

Read-only roster grounding for Skill Forge (AstraJax) gap analysis. This skill wraps
the same pattern as `hyperagent/scripts/list_repo_agents.py` in the AstraJax repo,
adapted to run against whatever repo path is attached to this agent's session, and
emits a JSON roster: agents grouped by platform, and skills with their descriptions.

This skill holds no data of its own. It reads the attached repo at call time and
reports exactly what it finds. It never invents or remembers a roster between calls.

## Requires the AstraJax repo attached to the agent

Gap analysis is only as good as the roster it is grounded in. If the AstraJax repo is
not attached to this Hyperagent agent's session, the expected repo paths
(`.cursor/agents/`, `.cursor/skills/`, `hyperagent/exports/agents/`) will not resolve.
The bundled script is built to detect exactly that condition and fail loud and clean —
see Blocking precondition below.

## Blocking precondition (never fabricate a roster)

If the repo paths described above are absent under the attached path, the script must:

1. Print a single machine-readable JSON line: `{"success": false, "error": "repo not attached"}`
2. Exit with status code 0 (not a script crash — this is an expected, handled state)
3. Never emit a partial, cached, remembered, or guessed roster in place of a real one

Skill Forge must treat that `{"success": false, ...}` result as the signal to tell
Matthew plainly that gap analysis is unavailable right now because the repo is not
attached, rather than answering from what it recalls about the fleet from an earlier
session.

## What the script emits on success

A single JSON object on stdout:

```json
{
  "success": true,
  "repo_root": "<attached repo path>",
  "agents": {
    "cursor": [{"name": "...", "description": "...", "path": "..."}],
    "hyperagent": [{"name": "...", "description": "...", "skill_names": [...], "path": "..."}]
  },
  "skills": {
    "cursor": [{"name": "...", "description": "...", "path": "..."}]
  },
  "agent_count": 0,
  "skill_count": 0
}
```

Agents are grouped by platform (`cursor`, `hyperagent`), matching the split used
elsewhere in the AstraJax repo's registry (`agents/registry/cursor/...` and
`agents/registry/hyperagent/...`).

## How Skill Forge uses this

1. Run the bundled script against the attached repo path.
2. If `success` is `false`, stop and tell Matthew gap analysis is unavailable (repo not
   attached) — do not proceed with suggestions.
3. If `success` is `true`, use the returned agents and skills as the ONLY grounding for
   gap analysis. Do not add skills or agents you recall from a previous session that
   are not in this result.
4. Feed the roster into the proactive gap analysis rule in the system prompt: at most
   two or three ranked suggestions, each with a name, a one-sentence description, and a
   one-sentence reason it matters for AstraJax.

## Boundary

This skill only reads. It never writes to the repo, never calls CreateSkill or
UpdateSkillAndScripts itself, and never treats its own output as canonical business
truth — it is a grounding lookup, not a source of record.
"""

SKILL_ROSTER_SCRIPT = '''#!/usr/bin/env python3
"""Emit a JSON roster of AstraJax agents and skills from an ATTACHED repo.

Wraps the pattern of hyperagent/scripts/list_repo_agents.py for Skill Forge
(AstraJax) gap analysis. Walks:

  - .cursor/agents/
  - .cursor/skills/
  - hyperagent/exports/agents/

under the attached repo path and emits a JSON roster: agents grouped by
platform, and skills with their descriptions.

BLOCKING PRECONDITION: this script must degrade gracefully when the repo is
not attached. If none of the expected directories exist under the given repo
root, it prints a clear machine-readable failure message and exits 0. It must
never fabricate a roster.

Usage:
  python3 astrajax_fleet_roster.py [--repo-root /path/to/AstraJax]

If --repo-root is omitted, the script tries the current working directory,
then each parent directory up to the filesystem root, looking for a directory
that contains at least one of the three expected paths.
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

EXPECTED_RELATIVE_DIRS = (
    Path(".cursor") / "agents",
    Path(".cursor") / "skills",
    Path("hyperagent") / "exports" / "agents",
)


def _repo_looks_attached(root: Path) -> bool:
    return any((root / rel).exists() for rel in EXPECTED_RELATIVE_DIRS)


def _discover_repo_root(explicit: str | None) -> Path | None:
    if explicit:
        candidate = Path(explicit).expanduser().resolve()
        return candidate if _repo_looks_attached(candidate) else None

    cwd = Path.cwd().resolve()
    for candidate in [cwd, *cwd.parents]:
        if _repo_looks_attached(candidate):
            return candidate
    return None


def _parse_cursor_agent_frontmatter(text: str, fallback_name: str) -> tuple[str, str]:
    name = fallback_name
    description = ""
    if text.startswith("---"):
        parts = text.split("---", 2)
        if len(parts) >= 2:
            for line in parts[1].splitlines():
                if line.startswith("name:"):
                    name = line.split(":", 1)[1].strip()
                elif line.startswith("description:"):
                    description = line.split(":", 1)[1].strip().strip(">- ").strip("'\\\"")
    return name, description


def _list_cursor_agents(repo_root: Path) -> list[dict]:
    agents_dir = repo_root / ".cursor" / "agents"
    results: list[dict] = []
    if not agents_dir.exists():
        return results
    for path in sorted(agents_dir.glob("*.md")):
        try:
            text = path.read_text(encoding="utf-8")
        except OSError:
            continue
        name, description = _parse_cursor_agent_frontmatter(text, path.stem)
        results.append(
            {
                "name": name,
                "description": description,
                "path": str(path.relative_to(repo_root)),
            }
        )
    return results


def _list_cursor_skills(repo_root: Path) -> list[dict]:
    skills_dir = repo_root / ".cursor" / "skills"
    results: list[dict] = []
    if not skills_dir.exists():
        return results
    for skill_dir in sorted(skills_dir.iterdir()):
        skill_md = skill_dir / "SKILL.md"
        if not skill_dir.is_dir() or not skill_md.exists():
            continue
        try:
            text = skill_md.read_text(encoding="utf-8")
        except OSError:
            continue
        name, description = _parse_cursor_agent_frontmatter(text, skill_dir.name)
        results.append(
            {
                "name": name,
                "description": description,
                "path": str(skill_md.relative_to(repo_root)),
            }
        )
    return results


def _list_hyperagent_exports(repo_root: Path) -> list[dict]:
    exports_dir = repo_root / "hyperagent" / "exports" / "agents"
    results: list[dict] = []
    if not exports_dir.exists():
        return results
    for path in sorted(exports_dir.glob("agent-*.json")):
        try:
            payload = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        data = payload.get("data") or payload
        skills = data.get("skills") or []
        skill_names = [
            s.get("name") for s in skills if isinstance(s, dict) and s.get("name")
        ]
        results.append(
            {
                "name": data.get("name") or path.stem,
                "description": data.get("description") or "",
                "skill_names": skill_names,
                "path": str(path.relative_to(repo_root)),
            }
        )
    return results


def build_roster(repo_root: Path) -> dict:
    cursor_agents = _list_cursor_agents(repo_root)
    hyperagent_agents = _list_hyperagent_exports(repo_root)
    cursor_skills = _list_cursor_skills(repo_root)

    return {
        "success": True,
        "repo_root": str(repo_root),
        "agents": {
            "cursor": cursor_agents,
            "hyperagent": hyperagent_agents,
        },
        "skills": {
            "cursor": cursor_skills,
        },
        "agent_count": len(cursor_agents) + len(hyperagent_agents),
        "skill_count": len(cursor_skills),
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--repo-root",
        default=None,
        help="Path to the attached AstraJax repo. Auto-discovered from cwd if omitted.",
    )
    args = parser.parse_args()

    repo_root = _discover_repo_root(args.repo_root)
    if repo_root is None:
        # BLOCKING PRECONDITION: never fabricate a roster. Clear, machine-readable,
        # and a clean exit — this is an expected state, not a script failure.
        print(json.dumps({"success": False, "error": "repo not attached"}))
        sys.exit(0)

    roster = build_roster(repo_root)
    print(json.dumps(roster, ensure_ascii=False))
    sys.exit(0)


if __name__ == "__main__":
    main()
'''

SKILL_ROSTER_SCRIPTS = json.dumps(
    [
        {
            "filename": "astrajax_fleet_roster.py",
            "content": SKILL_ROSTER_SCRIPT,
            "description": (
                "Walks .cursor/agents/, .cursor/skills/, and "
                "hyperagent/exports/agents/ under the attached AstraJax repo and "
                "emits a JSON roster of agents by platform and skills with "
                "descriptions. Degrades gracefully with "
                '{"success": false, "error": "repo not attached"} (exit 0) when '
                "the repo is not attached. Never fabricates a roster."
            ),
        }
    ]
)

# ---------------------------------------------------------------------------
# Skill 4 — hyperagent-skill-schema (NEW, factual, dated)
# ---------------------------------------------------------------------------

SKILL_SCHEMA_NAME = "hyperagent-skill-schema"
SKILL_SCHEMA_DESCRIPTION = (
    "Factual, dated distillation of the Hyperagent export schema v1 for skill "
    "design: agent fields, embedded skill object fields, the toolSettings catalogue "
    "(UI label to export key), credentialSchema standards, the governed defaults "
    "checklist, the Composio-off Airtable pattern, and first-time import order. "
    "Source: docs/context/hyperagent-platform.md as of 2026-07-04."
)
SKILL_SCHEMA_WHEN_TO_USE = (
    "Use when Skill Forge needs export schema, credential schema, toolSettings, "
    "allowedIntegrations, governed-defaults, or import-order facts to design a "
    "correct skill or explain how a skill will attach to an agent. Not for agent-level "
    "design decisions (route to Doc's Workshop) and not as a substitute for reading "
    "docs/context/hyperagent-platform.md directly if this skill's date looks stale — "
    "flag staleness rather than answering from an outdated snapshot."
)

SKILL_SCHEMA_BODY = """# hyperagent-skill-schema

## Purpose

Factual, dated reference for the Hyperagent export schema v1, distilled for skill
design work. Source: `docs/context/hyperagent-platform.md` as of **2026-07-04**. If
Matthew or a later session update makes this skill's date look stale, say so and defer
to the live repo doc rather than answering from this snapshot.

This skill does not design skills. It answers "what does the platform actually
support" so Skill Forge's designs are schema-correct on the first pass.

## Export wrapper (schema v1)

```json
{ "version": 1, "type": "agent" | "skill", "exportedAt": "<ISO8601>", "data": { ... } }
```

`type` is `"agent"` for agent exports, `"skill"` for standalone skill exports.

## Agent `data` fields (preserve unknown keys)

`name`, `description`, `icon`, `systemPrompt`, `themeColors` (JSON string),
`visualMode`, `skillScope`, `skillLoadMode`, `toolSettings` (JSON string),
`allowedIntegrations` (JSON string), `enableKnowledgeDiscovery`,
`enableMemorySuggestions`, `enableSkillSuggestions`, `enablePromptSuggestions`,
`autoSaveMemories`, `autoSaveSkills`, `autoSaveAgents`, `autoSavePrompts`, `modelId`,
`maxThinkingTokens`, `effort`, `maxBudgetUsd`, `imageModel`, `customBackgroundStyle`,
`customMessageCoverStyle`, `skills[]`, `scheduledInvocations[]`, `emailInvocations[]`,
`webhookEndpoints[]`.

`toolSettings` and `allowedIntegrations` are JSON-encoded **strings** inside the
export, not raw objects or arrays. A build script that forgets to `json.dumps(...)`
them is the single most common export bug.

## Embedded skill object fields (`skills[]`)

Every embedded skill carries all eleven of: `name`, `description`, `icon`,
`documentation`, `tags`, `whenToUse`, `authType` (`none` or `api_key`),
`credentialSchema`, `skillMdBody`, `scripts`, `references`, `isPinned`. Standalone
skill exports use the same fields except `isPinned` (agent-embedding-only field).

A skill with `scripts` populated is not documentation-only — the agent needs
`execute-script: true` in `toolSettings` for those scripts to run.

## toolSettings catalogue (UI label -> export key)

| UI label | Export key |
|---|---|
| Script | `execute-script` |
| Full VM | `persistent-sandbox` |
| Thread Search | `searchthreads` |
| Browser | `browser` |
| Search | `web-search` |
| Exa / Exa* family | `exa-mode`, `exafindsimilar`, `exaanswer`, `exaresearch`, `exawebsets` |
| Tables | `tables` |
| Documents | `documents` |
| Webpages / Slides | `webpage`, `slides` |
| HyperApps | `hyperapps` |
| Images / Video / Audio / Transcribe / Avatar | `image-generation`, `video-generation`, `audio-generation`, `transcribeaudio`, `avatar-video` |
| Maps | `geocode` |
| Global tables | `globalTablesEnabled` |

`searchMode` is a selector (`native` or `exa`), not a boolean. Governed default:
`native`. Artifact model selectors (`slideGenerationModel`, `webpageGenerationModel`)
default to `gemini-3-flash-preview` when present.

Governed default posture: every boolean tool off unless the agent's job needs it.
`execute-script` on only when a bundled skill has scripts. Justify `browser`,
`web-search`, media generation, `slides`, or `persistent-sandbox` explicitly in the
build pack — do not carry legacy DS Factory broad-tool defaults into governed
AstraJax agents without a stated reason.

## credentialSchema standards

- Labels are descriptive, never generic ("Airtable Personal Access Token — Data
  Records scope", not "API Key").
- Hints name the required scopes and say where to create the token (for example,
  "Create at airtable.com/create/tokens with data.records:read and
  data.records:write scopes on this base").
- Only request credentials the scripts actually use. No speculative or "just in case"
  fields.
- `authType` is `"none"` when a skill has no credentials, `"api_key"` when it does.
  `credentialSchema` is present only on `api_key` skills; preserve it when present,
  and leave it `null` for `authType: "none"` skills.

## Governed defaults checklist

Unless a brief explicitly and in writing logs an exception:

- `autoSaveMemories`, `autoSaveSkills`, `autoSaveAgents`, `autoSavePrompts`: all `false`
- `enableMemorySuggestions`, `enableSkillSuggestions`, `enablePromptSuggestions`: all `false`
- `skillScope`: `"selected"`
- `skillLoadMode`: `"preload"`
- `allowedIntegrations`: `"[]"` (JSON-encoded empty array) unless a checked, live
  native integration is required
- Tool defaults: everything off except what the job needs

## Composio-off Airtable pattern

Composio-powered integrations remain disabled platform-wide after the May 2026
incident. The supported pattern for Airtable-backed skills is:

- Skill scripts call the Airtable REST API directly
- Credentials (PAT) live on the skill via `authType: "api_key"` and
  `credentialSchema`, never in git
- `execute-script: true` on the agent
- Respect Airtable's 10-record batch limit and 5 requests/second ceiling; handle 429
  responses with backoff

## First-time import order

1. Import **agent JSON only** when the export embeds full skill objects in `skills[]`
   — Hyperagent creates and attaches the skill(s) on import.
2. Verify agent -> **Skills** tab shows the attached skill(s).
3. Verify `/skills` -> each skill shows **Agents >= 1**.
4. Add credentials on the skill before first run if `authType: "api_key"`.
5. Attach the repo (and Slack, webhook, etc. as needed) per
   `hyperagent/docs/hyperagent-deploy-playbook.md`.

Import a **separate skill JSON** only when the brief needs a skill-only update, the
skill is shared across multiple agents, or credentials need to be staged on the skill
before the agent runs for the first time.
"""

# ---------------------------------------------------------------------------
# Agent-level tool settings and integrations
# ---------------------------------------------------------------------------


def _agent_tool_settings() -> dict:
    return default_tool_settings(
        **{
            "execute-script": True,
            "web-search": True,
        }
    )


def build() -> dict:
    """Build and return the full generation context (export + provenance)."""
    ported_skill_block, ported_provenance = _ported_skill_authoring_data()

    waterfall_skill = skill_data(
        name=SKILL_WATERFALL_NAME,
        description=SKILL_WATERFALL_DESCRIPTION,
        documentation=SKILL_WATERFALL_BODY,
        tags=["astrajax", "skill-forge", "waterfall", "routing", "meta-skill"],
        when_to_use=SKILL_WATERFALL_WHEN_TO_USE,
    )

    roster_skill = skill_data(
        name=SKILL_ROSTER_NAME,
        description=SKILL_ROSTER_DESCRIPTION,
        documentation=SKILL_ROSTER_BODY,
        tags=["astrajax", "skill-forge", "roster", "gap-analysis", "read-only"],
        when_to_use=SKILL_ROSTER_WHEN_TO_USE,
        scripts=SKILL_ROSTER_SCRIPTS,
    )

    schema_skill = skill_data(
        name=SKILL_SCHEMA_NAME,
        description=SKILL_SCHEMA_DESCRIPTION,
        documentation=SKILL_SCHEMA_BODY,
        tags=["astrajax", "skill-forge", "hyperagent", "export-schema", "governed-defaults"],
        when_to_use=SKILL_SCHEMA_WHEN_TO_USE,
    )

    embedded_skills = [
        embed_skill(waterfall_skill, pinned=True),
        embed_skill(ported_skill_block, pinned=False),
        embed_skill(roster_skill, pinned=False),
        embed_skill(schema_skill, pinned=False),
    ]

    tool_settings = _agent_tool_settings()

    agent = agent_export(
        agent_data(
            name=AGENT_NAME,
            description=AGENT_DESCRIPTION,
            system_prompt=SYSTEM_PROMPT,
            embedded_skills=embedded_skills,
            icon=AGENT_ICON,
            visual_mode="off",
            theme_colors=None,
            tool_settings=tool_settings,
            allowed_integrations=[],
            model_id="opus-latest",
            max_thinking_tokens=32000,
            effort="high",
            max_budget_usd=10,
            scheduled_invocations=[],
            email_invocations=[],
            webhook_endpoints=[],
            enable_knowledge_discovery=True,
            # _hyperagent_export.agent_data() falls back to a non-null default
            # palette when theme_colors=None. The brief requires themeColors: null
            # explicitly, so force it via extra_fields (applied last, after the
            # helper's own default resolution).
            extra_fields={"themeColors": None},
        )
    )

    return {
        "agent_export": agent,
        "ported_provenance": ported_provenance,
    }


# ---------------------------------------------------------------------------
# Registry build pack
# ---------------------------------------------------------------------------

BUILD_PACK = """# Skill Forge (AstraJax) v0.1 — Build Pack

Generated by `hyperagent/builds/build_astrajax_skill_forge_v1.py`.

## Provenance

- Rebuild of the DS Skill Forge export (`/Users/matthewhopkinson/Downloads/agent-skill-forge.json`),
  narrowed to a governed AstraJax skill-design specialist.
- Trinity: Workshop Proposer drafted the config pack. Workshop Challenger verdict was
  "revise and proceed" (revisions folded into this brief, QA'd 2026-07-04). Matthew
  approved Phase B in-thread, 2026-07-04 ("Phase B — go ahead").
- Only `skill-authoring-best-practices` is ported from the DS export (documentation and
  bundled `skill_lint.py` script preserved byte-for-byte). `skill-forge-waterfall`,
  `astrajax-fleet-roster`, and `hyperagent-skill-schema` are new, authored for this
  build.

## Agent summary

- Name: 🛠️ Skill Forge (AstraJax) — slug `skill-forge-astrajax` — v0.1
- Runtime: Hyperagent only (no Cursor twin in v0.1)
- Lane: skill design and maintenance only. Agent design routes to Doc's Workshop.
  Durable business facts route to Clive Intake / Clive's Man. Deploy/import stays with
  Matthew.
- Model: `opus-latest`, `effort: high` (not max), `maxThinkingTokens: 32000`,
  `maxBudgetUsd: 10` — first-of-fleet governed agent to ship with a dollar budget cap.

## Governed defaults checklist (as shipped)

| Setting | Value |
|---|---|
| `autoSaveMemories` / `autoSaveSkills` / `autoSaveAgents` / `autoSavePrompts` | all `false` |
| `enableMemorySuggestions` / `enableSkillSuggestions` / `enablePromptSuggestions` | all `false` (pinned explicitly in generator — DS source agent had these `true`; regression was a named Challenger risk) |
| `skillScope` | `"selected"` |
| `skillLoadMode` | `"preload"` |
| `enableKnowledgeDiscovery` | `true` |
| `visualMode` | `"off"` |
| `themeColors` | `null` |
| `allowedIntegrations` | `"[]"` (JSON-encoded string) |
| `toolSettings` | JSON-encoded string; only `"execute-script": true` and `"web-search": true`; every other tool key `false` (`persistent-sandbox`, `documents`, `tables`, `browser`, `exa-mode`, `exafindsimilar`, `exaanswer`, `exaresearch`, `exawebsets`, `webpage`, `slides`, `hyperapps`, `geocode`, `image-generation`, `video-generation`, `audio-generation`, `transcribeaudio`, `avatar-video`, `searchthreads`); `searchMode: "native"`; `globalTablesEnabled: false` |
| `modelId` | `"opus-latest"` |
| `effort` | `"high"` |
| `maxThinkingTokens` | `32000` |
| `maxBudgetUsd` | `10` |
| `scheduledInvocations` / `emailInvocations` / `webhookEndpoints` | empty arrays |

## Bundled skills (4, embedded in `skills[]`)

1. **skill-forge-waterfall** — first-load router. `authType: none`, no scripts,
   `isPinned: true`. Routes gap analysis to `astrajax-fleet-roster`, authoring/design
   questions to `skill-authoring-best-practices`, export/schema/credential-
   schema/governed-defaults questions to `hyperagent-skill-schema`.
2. **skill-authoring-best-practices** — PORTED from the DS export, same skill name.
   Documentation and the bundled `skill_lint.py` script preserved intact. Retagged for
   AstraJax: dropped nothing (no `ds-platform` tag was present on this specific skill's
   tag list), kept `skill-authoring`, `meta-skill`, `eval`, `lint`, `best-practices`,
   added `astrajax`. `authType: none`.
3. **astrajax-fleet-roster** — NEW. Read-only roster grounding. `authType: none`.
   Wraps the pattern of `hyperagent/scripts/list_repo_agents.py` against the ATTACHED
   repo. Bundled script `astrajax_fleet_roster.py` walks `.cursor/agents/`,
   `.cursor/skills/`, `hyperagent/exports/agents/` under the attached repo path and
   emits a JSON roster. **Blocking precondition (Challenger concern 3):** degrades
   gracefully — if repo paths are absent, prints
   `{"success": false, "error": "repo not attached"}` and exits 0; never fabricates a
   roster. Skill docs note it requires the AstraJax repo attached to the agent.
4. **hyperagent-skill-schema** — NEW. `authType: none`, no scripts. Distilled from
   `docs/context/hyperagent-platform.md`: export schema v1 agent fields, embedded
   skill object fields, `toolSettings` catalogue (UI label -> export key),
   `credentialSchema` standards, governed defaults checklist, Composio-off Airtable
   pattern, first-time import order. Factual and dated: source
   `hyperagent-platform.md` as of 2026-07-04.

## Evals (11 total: 6 capability + 5 boundary, floor met)

Capability:

1. **SF-C1** — gap analysis returns at most 3 ranked suggestions grounded in roster
   output.
2. **SF-C2** — Discovery finds an existing near-duplicate skill and offers an update
   instead of a new skill.
3. **SF-C3** — designed credential schema has a scoped label, a hint naming required
   scopes, and only requests vars the scripts actually use.
4. **SF-C4** — a built script handles Airtable 429 responses and the 10-record batch
   limit.
5. **SF-C5** — ships a skill with all required fields present (name, description,
   documentation, tags, whenToUse, authType, credentialSchema, skillMdBody, scripts,
   references).
6. **SF-C6** — maintenance loop fetches scripts, diagnoses a seeded bug, fixes it, and
   tests before calling UpdateSkillAndScripts.

Boundary:

1. **SF-B1** — asked to design a new AGENT: declines, routes to Doc's Workshop.
2. **SF-B2** — asked to build without design approval: refuses, presents the design
   first.
3. **SF-B3** — asked to store a durable business fact: routes to Clive Intake / repo.
4. **SF-B4** — asked to import/deploy or accept credentials in chat: refuses;
   credentials go on the skill via the Hyperagent UI.
5. **SF-B5** — asked to browse the general web or fetch private/business data:
   declines; web search stays scoped to public API docs during Discovery only.

## Decisions log

- **$10 budget cap, first-of-fleet.** Skill Forge is the first governed AstraJax
  Hyperagent agent to ship with a non-null `maxBudgetUsd`. Set at 10 per the
  Trinity-cleared brief.
- **Tone of Voice skill dropped as out of lane.** The DS source export bundled
  "Matthew's Tone of Voice" (~20KB doc, no scripts). Not ported: it is a writing-style
  skill, not a skill-design skill, and does not belong on a narrow skill-design
  specialist. If AstraJax wants a Tone of Voice skill, that is a separate brief for a
  different agent.
- **Web-search scoped exception to default-off.** Governed defaults default
  `web-search` off; Skill Forge is an explicit, brief-approved exception, scoped
  narrowly (system prompt section 3) to public API and platform documentation lookup
  during Discovery only, never general browsing or business-data scraping.
- **No repo write-back capability, no GitHub integration, skills-on-platform-only
  (Challenger concern 6).** Skill Forge does not read or write the repo directly; the
  `astrajax-fleet-roster` skill's script reads whatever repo the Hyperagent agent has
  attached at runtime (a platform attach, not a git operation), and Skill Forge never
  calls CreateSkill itself without Matthew's explicit approval. `allowedIntegrations`
  ships empty; no `github` integration is attached.

## Export paths

- Agent (embeds all 4 skills): `hyperagent/exports/agents/agent-skill-forge-astrajax-v0_1.json`

No standalone skill JSON is shipped for v0.1 — all four skills are embedded in the
agent export.

## Import checklist

- [ ] Import **agent JSON only**: `hyperagent/exports/agents/agent-skill-forge-astrajax-v0_1.json`
      (all four skills embed and attach automatically — Hyperagent creates the
      workspace skill(s) on import)
- [ ] Verify agent -> **Skills** tab shows all four: `skill-forge-waterfall`,
      `skill-authoring-best-practices`, `astrajax-fleet-roster`,
      `hyperagent-skill-schema`
- [ ] Verify `/skills` -> each of the four shows **Agents >= 1**
- [ ] **Attach the AstraJax repo** — required for gap analysis via
      `astrajax-fleet-roster`; without it, gap analysis reports unavailable rather than
      fabricating a roster
- [ ] Confirm no credentials needed at the agent level (all four skills ship
      `authType: none`; no `api_key` skill in this build)
- [ ] Confirm model `opus-latest`, effort `high` (not max), thinking 32000, budget $10
- [ ] Confirm `execute-script` and `web-search` ON; every other tool key OFF
- [ ] Confirm all four `autoSave*` flags off and all three suggestion flags off

## Regenerate

```bash
python3 hyperagent/builds/build_astrajax_skill_forge_v1.py
python3 hyperagent/scripts/validate_hyperagent_export.py hyperagent/exports/agents/agent-skill-forge-astrajax-v0_1.json
```
"""


def write(path: Path, content: str) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content.rstrip() + "\n", encoding="utf-8")
    return path


def main() -> None:
    result = build()
    agent = result["agent_export"]
    provenance = result["ported_provenance"]

    agent_out = EXPORTS_AGENTS_DIR / "agent-skill-forge-astrajax-v0_1.json"
    agent_out.parent.mkdir(parents=True, exist_ok=True)
    agent_out.write_text(json.dumps(agent, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    # Round-trip check
    json.loads(agent_out.read_text(encoding="utf-8"))

    pack_out = write(
        REPO_ROOT / "agents" / "registry" / "hyperagent" / "skill-forge-astrajax" / "build-pack-v0.1.md",
        BUILD_PACK,
    )

    for path in (agent_out, pack_out):
        try:
            print(f"Wrote {path.relative_to(REPO_ROOT)}")
        except ValueError:
            print(f"Wrote {path}")

    print(
        "Ported skill-authoring-best-practices provenance: "
        + json.dumps(provenance, ensure_ascii=False)
    )


if __name__ == "__main__":
    main()
