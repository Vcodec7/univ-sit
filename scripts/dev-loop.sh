#!/usr/bin/env bash
# Fast local loop before push: unit tests + UI regression guards.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
node --test tests/*.test.mjs
node scripts/ui-guard.mjs
echo "dev-loop OK"
