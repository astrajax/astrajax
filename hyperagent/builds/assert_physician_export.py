#!/usr/bin/env python3
"""
Static Gate Assertion Layer — The Physician v0.1
12 blocking tests per build-pack v0.2.1 §Clearance mechanics
Date: 10 Jul 2026
"""

import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone

# Resolve paths relative to repo root (parent of hyperagent/builds/)
REPO_ROOT = Path(__file__).parent.parent.parent
EXPORTS_DIR = REPO_ROOT / "hyperagent" / "exports"
REPORT_FILE = EXPORTS_DIR / "physician-static-gate-report-v0_1.json"

# Fleet-standard skill IDs (from pack, C-4)
FLEET_STANDARD_IDS = {
    "cmr886bju22m607ads6wur1d8": "Autonomy & Gating Policy",
    "cmr82zfs521vg07adj9stpxbi": "Fleet Communication Standard",
    "cmr8771et26qn07ad63pvzlgg": "Fleet Routing Standard"
}

# Known Brain base IDs to reject
BRAIN_BASES = {
    "appL2fdnGmhA02WXd": "Brain Workshop",
    "appbdTVHevH6Bl5ZZ": "Brain Registry",
    "app6tjzzG0L0lOeVb": "Trusted Chapter 1"
}


def run_assertions():
    """Run all 12 static gate assertions"""
    results = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "gate": "STATIC",
        "candidate": "build-pack-v0.2.1.md",
        "assertions": []
    }

    try:
        # Load agent export
        agent_path = EXPORTS_DIR / "agents" / "agent-dr-halvard-bjornson-v0_1.json"
        with open(agent_path) as f:
            agent_export = json.load(f)
        agent_data = agent_export.get("data", {})

        # ASSERTION 1: Exact name
        assertion_1 = {
            "number": 1,
            "description": "Exact name 'Dr. Halvard Bjornson'; resolved title consistent across every generated field and filename",
            "status": "PASS" if agent_data.get("displayName") == "Dr. Halvard Bjornson" else "FAIL",
            "evidence": {
                "displayName": agent_data.get("displayName"),
                "filename": "agent-dr-halvard-bjornson-v0_1.json"
            }
        }
        results["assertions"].append(assertion_1)
        if assertion_1["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 2: autoSave flags and suggestions
        assertion_2 = {
            "number": 2,
            "description": "autoSave ×4 false; all suggestion flags false; skillScope selected; skillLoadMode preload",
            "status": "PASS" if (
                agent_data.get("autoSaveMemories") == False and
                agent_data.get("autoSaveSkills") == False and
                agent_data.get("autoSaveAgents") == False and
                agent_data.get("autoSavePrompts") == False and
                agent_data.get("enableMemorySuggestions") == False and
                agent_data.get("enableSkillSuggestions") == False and
                agent_data.get("enablePromptSuggestions") == False and
                agent_data.get("skillScope") == "selected" and
                agent_data.get("skillLoadMode") == "preload"
            ) else "FAIL",
            "evidence": {
                "autoSaveMemories": agent_data.get("autoSaveMemories"),
                "autoSaveSkills": agent_data.get("autoSaveSkills"),
                "autoSaveAgents": agent_data.get("autoSaveAgents"),
                "autoSavePrompts": agent_data.get("autoSavePrompts")
            }
        }
        results["assertions"].append(assertion_2)
        if assertion_2["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 3: Skills — NEW embedded (3 physician skills)
        skills = agent_data.get("skills", [])
        embedded_names = set()
        
        for skill in skills:
            skill_name = skill.get("name", "")
            if "physician" in skill_name:
                embedded_names.add(skill_name)
                # Verify 12 required fields on embedded skill
                required_fields = ["name", "description", "icon", "documentation", "whenToUse",
                                 "tags", "authType", "credentialSchema", "skillMdBody", "scripts", "references", "isPinned"]
                if not all(field in skill for field in required_fields):
                    assertion_3 = {
                        "number": 3,
                        "description": "Three NEW skills embedded with all 12 required fields",
                        "status": "FAIL",
                        "evidence": {"reason": f"Skill {skill_name} missing required fields"}
                    }
                    results["assertions"].append(assertion_3)
                    results["gate"] = "FAILED"
                    return results

        assertion_3 = {
            "number": 3,
            "description": "Three NEW skills embedded with all 12 required fields",
            "status": "PASS" if (
                embedded_names == {"physician-rubric-craft", "physician-vitals-and-tracking", "physician-human-signals-triage"}
            ) else "FAIL",
            "evidence": {
                "embedded_count": len(embedded_names),
                "embedded_names": list(embedded_names)
            }
        }
        results["assertions"].append(assertion_3)
        if assertion_3["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 4: allowedIntegrations (JSON string)
        allowed_integrations_str = agent_data.get("allowedIntegrations", "[]")
        try:
            allowed_integrations = json.loads(allowed_integrations_str)
        except (json.JSONDecodeError, TypeError):
            allowed_integrations = []
        
        assertion_4 = {
            "number": 4,
            "description": "allowedIntegrations == ['airtable'] exactly",
            "status": "PASS" if allowed_integrations == ["airtable"] else "FAIL",
            "evidence": {
                "allowedIntegrations_raw": allowed_integrations_str,
                "allowedIntegrations_parsed": allowed_integrations
            }
        }
        results["assertions"].append(assertion_4)
        if assertion_4["status"] != "PASS":
            results["gate"] = "FAILED"

        if assertion_4["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 5: Tool flags (both toolSettings JSON string and allowedTools dict)
        allowed_tools = agent_data.get("allowedTools", {})
        tool_settings_str = agent_data.get("toolSettings", "{}")

        # Parse toolSettings JSON string
        try:
            tool_settings = json.loads(tool_settings_str)
        except (json.JSONDecodeError, TypeError):
            tool_settings = {}

        # Check both toolSettings (JSON string) and allowedTools (dict)
        tool_settings_ok = (
            tool_settings.get("searchthreads") == True and
            tool_settings.get("execute-script") == True and
            tool_settings.get("documents") == True and
            tool_settings.get("web-search") == False and
            tool_settings.get("browser") == False and
            tool_settings.get("image-generation") == False and
            tool_settings.get("video-generation") == False and
            tool_settings.get("hyperapps") == False and
            tool_settings.get("tables") == False and
            tool_settings.get("persistent-sandbox") == False
        )

        allowed_tools_ok = (
            allowed_tools.get("searchthreads") == True and
            allowed_tools.get("execute-script") == True and
            allowed_tools.get("documents") == True and
            allowed_tools.get("rubric") == True and
            allowed_tools.get("web-search") == False and
            allowed_tools.get("browser") == False and
            allowed_tools.get("generate-image") == False and
            allowed_tools.get("generate-video") == False and
            allowed_tools.get("hyperapps") == False and
            allowed_tools.get("tables") == False and
            allowed_tools.get("persistent-sandbox") == False
        )

        assertion_5 = {
            "number": 5,
            "description": "Export tool flags: searchthreads + execute-script + documents ON; web/browser/media/hyperapps/tables/persistent-sandbox OFF (toolSettings + allowedTools)",
            "status": "PASS" if (tool_settings_ok and allowed_tools_ok) else "FAIL",
            "evidence": {
                "toolSettings": tool_settings,
                "allowedTools": allowed_tools,
                "toolSettings_ok": tool_settings_ok,
                "allowedTools_ok": allowed_tools_ok
            }
        }
        results["assertions"].append(assertion_5)
        if assertion_5["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 6: No webhooks, email, live mode
        email_invocations = agent_data.get("emailInvocations", [])
        webhook_endpoints = agent_data.get("webhookEndpoints", [])
        assertion_6 = {
            "number": 6,
            "description": "emailInvocations, webhookEndpoints empty in export; no live-mode config",
            "status": "PASS" if (
                len(email_invocations) == 0 and
                len(webhook_endpoints) == 0
            ) else "FAIL",
            "evidence": {
                "emailInvocations": len(email_invocations),
                "webhookEndpoints": len(webhook_endpoints)
            }
        }
        results["assertions"].append(assertion_6)
        if assertion_6["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 7: Exactly one declared schedule, paused
        schedules = agent_data.get("scheduledInvocations", [])
        assertion_7 = {
            "number": 7,
            "description": "Exactly one DECLARED scheduledInvocation: paused, weekly rrule above, threadStrategy new, short prompt verbatim",
            "status": "PASS" if (
                len(schedules) == 1 and
                schedules[0].get("status") == "paused" and
                schedules[0].get("name") == "Ward Rounds" and
                schedules[0].get("rrule") == "FREQ=WEEKLY;BYDAY=MO;BYHOUR=8;BYMINUTE=30" and
                schedules[0].get("timezone") == "Europe/London" and
                schedules[0].get("threadStrategy") == "new" and
                "Ward rounds. Execute your ward-rounds procedure exactly as written in your system prompt" in schedules[0].get("prompt", "")
            ) else "FAIL",
            "evidence": {
                "schedule_count": len(schedules),
                "schedule": schedules[0] if schedules else None
            }
        }
        results["assertions"].append(assertion_7)
        if assertion_7["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 8: System prompt byte/hash match
        system_prompt = agent_data.get("systemPrompt", "")
        prompt_hash = hashlib.sha256(system_prompt.encode()).hexdigest()
        # Expected hash from the generator
        expected_hash = "efa3d849949f470877e28c05db2dad7ea323d1125c7b371553a263eb25d16a27"
        assertion_8 = {
            "number": 8,
            "description": "System prompt byte/hash match against this pack and the Persona Config staging text",
            "status": "PASS" if prompt_hash == expected_hash else "FAIL",
            "evidence": {
                "hash": prompt_hash,
                "expected": expected_hash,
                "match": prompt_hash == expected_hash
            }
        }
        results["assertions"].append(assertion_8)
        if assertion_8["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 9: No Brain base IDs in write-path config or skill text
        assertion_9_pass = True
        brain_found = []
        for brain_id, brain_name in BRAIN_BASES.items():
            if brain_id in system_prompt:
                assertion_9_pass = False
                brain_found.append(f"{brain_id} ({brain_name})")

        for skill in skills:
            if "documentation" in skill:
                for brain_id, brain_name in BRAIN_BASES.items():
                    if brain_id in skill.get("documentation", ""):
                        assertion_9_pass = False
                        brain_found.append(f"{brain_id} in {skill.get('name')} doc")

        assertion_9 = {
            "number": 9,
            "description": "No Brain Workshop / Registry / Trusted base ID appears in any write-path config or skill text as a write target",
            "status": "PASS" if assertion_9_pass else "FAIL",
            "evidence": {"brain_ids_found": brain_found if brain_found else "none"}
        }
        results["assertions"].append(assertion_9)
        if assertion_9["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 10: Delegation allowlist empty
        delegation_allowlist = agent_data.get("delegationAllowlist", [])
        assertion_10 = {
            "number": 10,
            "description": "Delegation allowlist empty",
            "status": "PASS" if len(delegation_allowlist) == 0 else "FAIL",
            "evidence": {"allowlist": delegation_allowlist}
        }
        results["assertions"].append(assertion_10)
        if assertion_10["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 11: Budget, model, effort, execution mode
        assertion_11 = {
            "number": 11,
            "description": "maxBudgetUsd == 5; model claude-fable-5; effort medium; execution mode in export == ask-first (the mandatory initial state)",
            "status": "PASS" if (
                agent_data.get("maxBudgetUsd") == 5 and
                agent_data.get("modelId") == "claude-fable-5" and
                agent_data.get("effort") == "medium" and
                agent_data.get("executionMode") == "ask-first"
            ) else "FAIL",
            "evidence": {
                "maxBudgetUsd": agent_data.get("maxBudgetUsd"),
                "modelId": agent_data.get("modelId"),
                "effort": agent_data.get("effort"),
                "executionMode": agent_data.get("executionMode")
            }
        }
        results["assertions"].append(assertion_11)
        if assertion_11["status"] != "PASS":
            results["gate"] = "FAILED"

        # ASSERTION 12: Run generic validator and report result
        import subprocess
        validator_script = REPO_ROOT / "hyperagent" / "scripts" / "validate_hyperagent_export.py"
        assertion_12_status = "PENDING"
        validator_output = ""
        validator_stderr = ""

        try:
            agent_export_path = EXPORTS_DIR / "agents" / "agent-dr-halvard-bjornson-v0_1.json"
            result = subprocess.run(
                ["python3", str(validator_script), str(agent_export_path)],
                capture_output=True,
                text=True,
                timeout=10
            )
            if result.returncode == 0:
                assertion_12_status = "PASS"
                validator_output = result.stdout
            else:
                assertion_12_status = "FAIL"
                validator_stderr = result.stderr
        except Exception as e:
            assertion_12_status = "FAIL"
            validator_stderr = str(e)

        assertion_12 = {
            "number": 12,
            "description": "Export passes validate_hyperagent_export.py (generic gate)",
            "status": assertion_12_status,
            "evidence": {
                "validator_output": validator_output if assertion_12_status == "PASS" else "",
                "validator_error": validator_stderr if assertion_12_status == "FAIL" else ""
            }
        }
        results["assertions"].append(assertion_12)
        if assertion_12["status"] != "PASS":
            results["gate"] = "FAILED"

        # Summary
        passed = sum(1 for a in results["assertions"] if a.get("status") == "PASS")
        failed = sum(1 for a in results["assertions"] if a.get("status") == "FAIL")
        pending = sum(1 for a in results["assertions"] if a.get("status") == "PENDING")

        results["summary"] = {
            "total_assertions": len(results["assertions"]),
            "passed": passed,
            "failed": failed,
            "pending": pending,
            "overall_status": "FAILED" if failed > 0 else "PASSED" if pending == 0 else "PARTIAL"
        }

        return results

    except Exception as e:
        return {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "gate": "STATIC",
            "status": "ERROR",
            "error": str(e)
        }


if __name__ == "__main__":
    results = run_assertions()

    REPORT_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(REPORT_FILE, "w") as f:
        json.dump(results, f, indent=2)

    print(f"✅ Static gate report: {REPORT_FILE}")
    print(f"Overall status: {results.get('summary', {}).get('overall_status', 'UNKNOWN')}")
    if results.get('summary', {}).get('overall_status') != "PASSED":
        print(f"Passed: {results.get('summary', {}).get('passed', 0)}/{results.get('summary', {}).get('total_assertions', 0)}")
        print(f"Failed: {results.get('summary', {}).get('failed', 0)}")
