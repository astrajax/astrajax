#!/bin/bash
# Smoke test: POST a curator-audit payload to the Hyperagent Curator webhook.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
ENV_PATH="$REPO_ROOT/.env"

if [[ -f "$ENV_PATH" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_PATH"
  set +a
fi

URL="${HYPERAGENT_CURATOR_WEBHOOK_URL:-${CURATOR_WEBHOOK_URL:-}}"
SECRET="${HYPERAGENT_WEBHOOK_SECRET:-${CLIVE_CURATOR_WEBHOOK_SECRET:-}}"

if [[ -z "$URL" ]]; then
  echo "Set HYPERAGENT_CURATOR_WEBHOOK_URL (or CURATOR_WEBHOOK_URL) in .env or the environment." >&2
  exit 1
fi

TARGET="${1:-hyperagent-platform}"
CHECKS="${2:-stale,conflicts}"

PAYLOAD=$(cat <<EOF
{
  "mode": "curator-audit",
  "target": "$TARGET",
  "checks": "$CHECKS",
  "requestedBy": "terminal smoke test",
  "source": "test_curator_webhook.sh",
  "requestedAt": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "message": "Curator smoke test for target=$TARGET checks=$CHECKS"
}
EOF
)

CURL_ARGS=(-sS -w "\nHTTP_STATUS:%{http_code}\n" -X POST "$URL" -H "Content-Type: application/json" -d "$PAYLOAD")
if [[ -n "$SECRET" ]]; then
  CURL_ARGS+=(-H "X-Hyperagent-Webhook-Secret: $SECRET")
else
  echo "Warning: no HYPERAGENT_WEBHOOK_SECRET set; request may 403." >&2
fi

echo "POST $URL"
echo "target=$TARGET checks=$CHECKS"
echo "---"
curl "${CURL_ARGS[@]}"
echo ""
