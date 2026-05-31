# Change Log audit mirror

Append-only mirror of Airtable Change Log entries with hash chain fields.

Each line in `audit.jsonl` is one JSON object written by
`hyperagent/scripts/append_change_log.py`. Do not edit lines manually. If the
hash chain breaks, run `hyperagent/scripts/validate_context_architecture_v2.py`.
