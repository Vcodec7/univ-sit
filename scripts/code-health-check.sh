#!/usr/bin/env bash
# Full local code-health pass used after «проверь весь код».
# Does not hit ty/py. HTTP smoke is separate: bash scripts/smoke-sites.sh
#
# Usage:
#   bash scripts/code-health-check.sh
#   SKIP_TSC=1 bash scripts/code-health-check.sh   # only tests + ui:guard
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> unit tests"
node --test tests/*.test.mjs

echo "==> ui:guard"
node scripts/ui-guard.mjs

if [[ "${SKIP_TSC:-0}" != "1" ]]; then
  echo "==> tsc --noEmit"
  npx tsc --noEmit
fi

echo "code-health OK"
