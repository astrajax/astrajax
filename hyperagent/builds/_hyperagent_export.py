"""Shared Hyperagent export schema v1 helpers for build_*.py generators.

Centralises agent data shape, tool-settings catalogue, embedded-skill objects,
governed Clive defaults, and JSON-string encoding for toolSettings and
allowedIntegrations. Derive values from docs/context/hyperagent-platform.md.
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Mapping, Sequence

# ---------------------------------------------------------------------------
# Tool settings catalogue (observed keys; default off except searchMode + models)
# ---------------------------------------------------------------------------

TOOL_SETTINGS_KEYS: tuple[str, ...] = (
    "searchMode",
    "globalTablesEnabled",
    "exa-mode",
    "execute-script",
    "persistent-sandbox",
    "webpage",
    "webpageGenerationModel",
    "slides",
    "tables",
    "web-search",
    "browser",
    "image-generation",
    "video-generation",
    "audio-generation",
    "transcribeaudio",
    "avatar-video",
    "exafindsimilar",
    "exaanswer",
    "exaresearch",
    "exawebsets",
    "geocode",
    "hyperapps",
    "documents",
    "searchthreads",
    "slideGenerationModel",
)

TOOL_SETTINGS_DEFAULTS_OFF: dict[str, Any] = {
    "searchMode": "native",
    "globalTablesEnabled": False,
    "exa-mode": False,
    "execute-script": False,
    "persistent-sandbox": False,
    "webpage": False,
    "webpageGenerationModel": "gemini-3-flash-preview",
    "slides": False,
    "tables": False,
    "web-search": False,
    "browser": False,
    "image-generation": False,
    "video-generation": False,
    "audio-generation": False,
    "transcribeaudio": False,
    "avatar-video": False,
    "exafindsimilar": False,
    "exaanswer": False,
    "exaresearch": False,
    "exawebsets": False,
    "geocode": False,
    "hyperapps": False,
    "documents": False,
    "searchthreads": False,
    "slideGenerationModel": "gemini-3-flash-preview",
}

# ---------------------------------------------------------------------------
# Governed Clive defaults (non-negotiable unless brief logs an exception)
# ---------------------------------------------------------------------------

GOVERNED_AUTO_SAVE_KEYS: tuple[str, ...] = (
    "autoSaveMemories",
    "autoSaveSkills",
    "autoSaveAgents",
    "autoSavePrompts",
)

GOVERNED_SUGGESTION_KEYS: tuple[str, ...] = (
    "enableMemorySuggestions",
    "enableSkillSuggestions",
    "enablePromptSuggestions",
)

GOVERNED_SKILL_SCOPE = "selected"
GOVERNED_SKILL_LOAD_MODE = "preload"
GOVERNED_ALLOWED_INTEGRATIONS = "[]"

# ---------------------------------------------------------------------------
# Embedded skill required fields (preserve unknown keys on real exports)
# ---------------------------------------------------------------------------

EMBEDDED_SKILL_REQUIRED_FIELDS: tuple[str, ...] = (
    "name",
    "description",
    "icon",
    "documentation",
    "tags",
    "whenToUse",
    "authType",
    "credentialSchema",
    "skillMdBody",
    "scripts",
    "references",
    "isPinned",
)

SKILL_EXPORT_DATA_FIELDS: tuple[str, ...] = (
    "name",
    "description",
    "icon",
    "documentation",
    "tags",
    "whenToUse",
    "authType",
    "credentialSchema",
    "skillMdBody",
    "scripts",
    "references",
)


def exported_at_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.000Z")


def json_string(value: Any) -> str:
    """Serialize for toolSettings / allowedIntegrations (JSON string in export)."""
    return json.dumps(value)


def default_tool_settings(**overrides: Any) -> dict[str, Any]:
    """All tools off except searchMode and artifact model selectors; apply overrides."""
    settings = dict(TOOL_SETTINGS_DEFAULTS_OFF)
    for key in overrides:
        if key not in TOOL_SETTINGS_KEYS:
            raise ValueError(f"Unknown toolSettings key: {key!r}")
    settings.update(overrides)
    return settings


def governed_suggestion_flags() -> dict[str, bool]:
    return {key: False for key in GOVERNED_SUGGESTION_KEYS}


def governed_auto_save_flags() -> dict[str, bool]:
    return {key: False for key in GOVERNED_AUTO_SAVE_KEYS}


def skill_data(
    name: str,
    description: str,
    documentation: str,
    *,
    icon: str | None = None,
    tags: str | Sequence[str] = '["astrajax"]',
    when_to_use: str = "",
    auth_type: str = "none",
    credential_schema: Any = None,
    skill_md_body: str | None = None,
    scripts: Any = None,
    references: Any = None,
) -> dict[str, Any]:
    """Skill `data` block for standalone skill export or embedding."""
    if isinstance(tags, (list, tuple)):
        tags_str = json.dumps(list(tags))
    else:
        tags_str = tags
    body = skill_md_body if skill_md_body is not None else documentation
    return {
        "name": name,
        "description": description,
        "icon": icon,
        "documentation": documentation,
        "tags": tags_str,
        "whenToUse": when_to_use,
        "authType": auth_type,
        "credentialSchema": credential_schema,
        "skillMdBody": body,
        "scripts": scripts,
        "references": references,
    }


def embed_skill(skill_data_block: Mapping[str, Any], *, pinned: bool) -> dict[str, Any]:
    """Embedded skill object inside an agent export's skills[] array."""
    return {
        "name": skill_data_block["name"],
        "description": skill_data_block["description"],
        "icon": skill_data_block.get("icon"),
        "documentation": skill_data_block["documentation"],
        "tags": skill_data_block["tags"],
        "whenToUse": skill_data_block["whenToUse"],
        "authType": skill_data_block["authType"],
        "credentialSchema": skill_data_block.get("credentialSchema"),
        "skillMdBody": skill_data_block["skillMdBody"],
        "scripts": skill_data_block.get("scripts"),
        "references": skill_data_block.get("references"),
        "isPinned": pinned,
    }


def skill_export(
    skill_data_block: Mapping[str, Any],
    *,
    exported_at: str | None = None,
) -> dict[str, Any]:
    return {
        "version": 1,
        "type": "skill",
        "exportedAt": exported_at or exported_at_now(),
        "data": dict(skill_data_block),
    }


def agent_data(
    name: str,
    description: str,
    system_prompt: str,
    embedded_skills: Sequence[Mapping[str, Any]],
    *,
    icon: str | None = None,
    theme_colors: Mapping[str, str] | str | None = None,
    visual_mode: str = "off",
    tool_settings: Mapping[str, Any] | None = None,
    allowed_integrations: Sequence[str] | str = (),
    model_id: str = "opus-latest",
    max_thinking_tokens: int = 32000,
    effort: str = "max",
    max_budget_usd: Any = None,
    image_model: Any = None,
    custom_background_style: Any = None,
    custom_message_cover_style: Any = None,
    scheduled_invocations: Sequence[Any] = (),
    email_invocations: Sequence[Any] = (),
    webhook_endpoints: Sequence[Any] = (),
    enable_knowledge_discovery: bool = True,
    extra_fields: Mapping[str, Any] | None = None,
) -> dict[str, Any]:
    """Agent `data` block with governed defaults applied."""
    if tool_settings is None:
        tool_settings = default_tool_settings()
    if isinstance(theme_colors, Mapping):
        theme_colors_str = json_string(dict(theme_colors))
    elif isinstance(theme_colors, str):
        theme_colors_str = theme_colors
    else:
        theme_colors_str = json_string(
            {"primary": "#F3EDDB", "accent": "#A95A2E", "text": "#23271B"}
        )
    if isinstance(allowed_integrations, str):
        allowed_integrations_str = allowed_integrations
    else:
        allowed_integrations_str = json_string(list(allowed_integrations))

    data: dict[str, Any] = {
        "name": name,
        "description": description,
        "icon": icon,
        "systemPrompt": system_prompt.strip(),
        "themeColors": theme_colors_str,
        "visualMode": visual_mode,
        "skillScope": GOVERNED_SKILL_SCOPE,
        "skillLoadMode": GOVERNED_SKILL_LOAD_MODE,
        "toolSettings": json_string(dict(tool_settings)),
        "allowedIntegrations": allowed_integrations_str,
        "enableKnowledgeDiscovery": enable_knowledge_discovery,
        **governed_suggestion_flags(),
        **governed_auto_save_flags(),
        "modelId": model_id,
        "maxThinkingTokens": max_thinking_tokens,
        "effort": effort,
        "maxBudgetUsd": max_budget_usd,
        "imageModel": image_model,
        "customBackgroundStyle": custom_background_style,
        "customMessageCoverStyle": custom_message_cover_style,
        "skills": list(embedded_skills),
        "scheduledInvocations": list(scheduled_invocations),
        "emailInvocations": list(email_invocations),
        "webhookEndpoints": list(webhook_endpoints),
    }
    if extra_fields:
        data.update(extra_fields)
    return data


def agent_export(
    agent_data_block: Mapping[str, Any],
    *,
    exported_at: str | None = None,
) -> dict[str, Any]:
    return {
        "version": 1,
        "type": "agent",
        "exportedAt": exported_at or exported_at_now(),
        "data": dict(agent_data_block),
    }
