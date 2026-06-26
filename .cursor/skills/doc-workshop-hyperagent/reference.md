# doc-workshop-hyperagent — build-time reference (v0.2)

Short distillation for Hyperagent export builds. Exhaustive catalogue and UI maps:
**docs/context/hyperagent-platform.md**.

## Export wrapper

```json
{ "version": 1, "type": "agent" | "skill", "exportedAt": "...", "data": { ... } }
```

## JSON-string encoding (common footgun)

`toolSettings` and `allowedIntegrations` must be JSON-encoded **strings** inside `data`, not raw objects or arrays. Build with `json.dumps(...)`. The validation gate checks this.

## Agent `data` block (preserve unknown keys)

Observed core fields: `name`, `description`, `icon`, `systemPrompt`, `themeColors` (JSON string), `visualMode`, `skillScope`, `skillLoadMode`, `toolSettings` (JSON string), `allowedIntegrations` (JSON string), `enableKnowledgeDiscovery`, `enableMemorySuggestions`, `enableSkillSuggestions`, `enablePromptSuggestions`, `autoSaveMemories`, `autoSaveSkills`, `autoSaveAgents`, `autoSavePrompts`, `modelId`, `maxThinkingTokens`, `effort`, `maxBudgetUsd`, `imageModel`, `customBackgroundStyle`, `customMessageCoverStyle`, `skills[]`, `scheduledInvocations[]`, `emailInvocations[]`, `webhookEndpoints[]`.

Do not strip fields present in a live export just because this list omits them.

## Embedded skill object (`skills[]`)

Each embedded skill must include: `name`, `description`, `icon`, `documentation`, `tags`, `whenToUse`, `authType`, `credentialSchema`, `skillMdBody`, `scripts`, `references`, `isPinned`. Use the same object shape for every skill in the build. If a skill has `scripts`, set `execute-script` true in `toolSettings`.

Standalone skill exports use the same fields except `isPinned` (skill `data` block only).

## `toolSettings` catalogue (25 keys)

Canonical list lives in `hyperagent/builds/_hyperagent_export.py` as `TOOL_SETTINGS_KEYS`. Build with `default_tool_settings(**overrides)`:

`searchMode`, `globalTablesEnabled`, `exa-mode`, `execute-script`, `persistent-sandbox`, `webpage`, `webpageGenerationModel`, `slides`, `tables`, `web-search`, `browser`, `image-generation`, `video-generation`, `audio-generation`, `transcribeaudio`, `avatar-video`, `exafindsimilar`, `exaanswer`, `exaresearch`, `exawebsets`, `geocode`, `hyperapps`, `documents`, `searchthreads`, `slideGenerationModel`.

Default governed posture: all boolean tools off; `searchMode` = `native`; artifact model selectors = `gemini-3-flash-preview`. Enable only what the agent's job needs; justify browser, web search, media, slides, or sandbox in the build pack.

## Governed Clive defaults

Unless the brief logs an exception in the build pack:

| Setting | Value |
|---------|-------|
| `autoSaveMemories`, `autoSaveSkills`, `autoSaveAgents`, `autoSavePrompts` | `false` |
| `enableSkillSuggestions`, `enableMemorySuggestions`, `enablePromptSuggestions` | `false` |
| `enableKnowledgeDiscovery` | `true` |
| `skillScope` | `selected` |
| `skillLoadMode` | `preload` |
| `allowedIntegrations` | `"[]"` unless a checked live native integration is required |

## Shared export helper

`hyperagent/builds/_hyperagent_export.py` provides `agent_data()`, `skill_data()`, `embed_skill()`, `skill_export()`, `agent_export()`, `json_string()`, and `default_tool_settings()`.

## Validation gate

```bash
python3 hyperagent/scripts/validate_hyperagent_export.py path/to/export.json
```

Checks wrapper, JSON-string fields, autoSave flags, embedded-skill fields, and governed `skillScope` / `skillLoadMode`.
