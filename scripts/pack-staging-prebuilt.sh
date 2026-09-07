#!/usr/bin/env bash
# Pack Next standalone for staging (no .env, no uploads).
# gzip -1 / pigz: cheaper CPU, upload size almost the same as -9 for this payload.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="${1:-/tmp/yp-staging-prebuilt.tgz}"

if [[ ! -f "$ROOT/.next/standalone/server.js" ]]; then
  echo "Missing .next/standalone — run: SKIP_DB_AT_BUILD=1 npm run build" >&2
  exit 1
fi

mkdir -p "$ROOT/certs"

if command -v pigz >/dev/null 2>&1; then
  TAR_I=( -I 'pigz -1' )
else
  TAR_I=( -I 'gzip -1' )
fi

tar "${TAR_I[@]}" -cf "$OUT" \
  --exclude='public/uploads' \
  --exclude='public/backups' \
  --exclude='.env' \
  -C "$ROOT" \
  Dockerfile.prebuilt \
  docker-compose.staging.yml \
  prisma \
  prisma.config.ts \
  scripts \
  public \
  certs \
  .next/standalone \
  .next/static

echo "Packed $OUT ($(du -h "$OUT" | awk '{print $1}'))"
