---
name: clive-context-intake-slack-blocks
description: Slack Block Kit confirmation and read-back templates for Clive Intake. Load after draft, before Airtable create.
---

# clive-context-intake-slack-blocks

**When to load:** After you have a draft Context Intake record ready for user confirmation (before calling `create_context_intake.py`).

Use Slack Block Kit for confirmation when the Slack integration supports `chat.postMessage` with `blocks`. Fall back to plain text if blocks or buttons are unavailable.

## Confirmation blocks template

Replace placeholders before send. If the draft JSON exceeds Slack button `value` limits (150 chars), keep the full draft in thread context and put only a short confirm token in `value`, or use text fallback.

```json
{
  "blocks": [
    {
      "type": "header",
      "text": { "type": "plain_text", "text": "Log this context?", "emoji": true }
    },
    {
      "type": "section",
      "fields": [
        { "type": "mrkdwn", "text": "*Category:*\n{{category}}" },
        { "type": "mrkdwn", "text": "*Destination:*\n{{destination}}" },
        { "type": "mrkdwn", "text": "*Confidence:*\n{{confidence}}" },
        { "type": "mrkdwn", "text": "*Status:*\n{{status}}" }
      ]
    },
    {
      "type": "section",
      "text": {
        "type": "mrkdwn",
        "text": "*Title:* {{title}}\n*Next owner:* {{next_owner}}\n*Suggested action:* {{suggested_action}}\n*Reason:* {{one_sentence_reason}}"
      }
    },
    {
      "type": "actions",
      "block_id": "clive_intake_confirm",
      "elements": [
        {
          "type": "button",
          "action_id": "clive_intake_confirm_yes",
          "text": { "type": "plain_text", "text": "Confirm & log" },
          "style": "primary",
          "value": "confirm"
        },
        {
          "type": "button",
          "action_id": "clive_intake_confirm_edit",
          "text": { "type": "plain_text", "text": "Edit" },
          "value": "edit"
        },
        {
          "type": "button",
          "action_id": "clive_intake_confirm_cancel",
          "text": { "type": "plain_text", "text": "Cancel" },
          "style": "danger",
          "value": "cancel"
        }
      ]
    }
  ]
}
```

## Interaction handling

| action_id | Action |
|-----------|--------|
| `clive_intake_confirm_yes` | Create record via **clive-context-intake** / `create_context_intake.py` → post-create read-back → reply with Airtable link |
| `clive_intake_confirm_edit` | Ask one short question: "What should I change?" |
| `clive_intake_confirm_cancel` | "Cancelled. Nothing logged." |

Button click or short text (`yes`, `confirm`, `save it`, `log it`, `go`, `ok`) counts as confirm.

## Read-back in Slack (after create)

Plain text, one message, max 80 words:

```
Logged.

Record: {{title}}
Category: {{category}}
Destination: {{destination}}
Status: {{status}}
Owner: {{next_owner}}
Link: https://airtable.com/appYv601Oq7fKTCj0/tblJCmPGPUyszgFux/{{recordId}}
```

## Fallback text confirmation (≤80 words)

Same fields as the web confirmation template in **clive-context-intake**, one paragraph, end with `Confirm? (yes / edit / cancel)`
