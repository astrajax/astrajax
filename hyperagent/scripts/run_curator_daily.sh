#!/bin/bash
# Clive Curator daily cycle: run a read-only context health audit at 8am local time.
set -euo pipefail

REPO_ROOT="/Users/matthewhopkinson/Documents/AstraJax"
cd "$REPO_ROOT"

LOG_DIR="$REPO_ROOT/hyperagent/logs"
mkdir -p "$LOG_DIR"
LOG_FILE="$LOG_DIR/curator-daily-$(date +%Y%m%d).log"

{
  echo "=== curator context audit start $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  python3 hyperagent/scripts/audit_context_health.py --target daily --checks stale,conflicts,duplicates,unsupported,risky
  echo "=== curator context audit end $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
} >>"$LOG_FILE" 2>&1
