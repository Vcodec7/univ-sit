#!/usr/bin/env bash
# Pack Next standalone for staging (no .env, no uploads).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-/tmp/yp-staging-prebuilt.tgz}"

if [[ ! -f "$ROOT/.next/standalone/server.js" ]]; then
  echo "Missing .next/standalone — run: SKIP_DB_AT_BUILD=1 npm run build" >&2
  exit 1
fi

mkdir -p "$ROOT/certs"
tar -czf "$OUT" \
  -C "$ROOT" \
  Dockerfile.prebuilt \
  docker-compose.staging.yml \
  package.json \
  package-lock.json \
  prisma \
  prisma.config.ts \
  scripts \
  public \
  certs \
  .next/standalone \
  .next/static

echo "Packed $OUT ($(du -h "$OUT" | awk '{print $1}'))"
