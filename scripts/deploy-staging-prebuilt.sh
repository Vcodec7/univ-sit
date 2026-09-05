#!/usr/bin/env bash
# Install a prebuilt Next standalone bundle onto STAGING (ty.idivles.ru).
# Does not run `next build` on the 2GB VPS. Does not touch production (py).
#
# Expects a tarball at $1 (or /tmp/yp-staging-prebuilt.tgz) with:
#   Dockerfile.prebuilt, .next/standalone, .next/static, public, prisma,
#   prisma.config.ts, scripts, package.json
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT_DIR/scripts/lib/vps.sh"

STAGING_DOMAIN="${STAGING_DOMAIN:-ty.idivles.ru}"
BUNDLE="${1:-}"
if [[ -z "$BUNDLE" ]]; then
  BUNDLE="${YP_PREBUILT_TGZ:-/tmp/yp-staging-prebuilt.tgz}"
fi
if [[ ! -f "$BUNDLE" ]]; then
  echo "Missing prebuilt bundle: $BUNDLE" >&2
  echo "Build first: SKIP_DB_AT_BUILD=1 npm ci && npx prisma generate && npm run build" >&2
  echo "Then: bash scripts/pack-staging-prebuilt.sh" >&2
  exit 1
fi

yp_init_ssh

echo "==> [staging-prebuilt] upload $(du -h "$BUNDLE" | awk '{print $1}')"
yp_scp "$BUNDLE" "$HOST:/var/tmp/yp-staging-prebuilt.tgz"

EXPECTED_VER="$(python3 -c "import json; print(json.load(open('$ROOT_DIR/package.json'))['version'])")"

REMOTE_SCRIPT="/tmp/yp-stg-pre-$$.sh"
cat > "$REMOTE_SCRIPT" <<'REMOTE'
set -euo pipefail
APP=/opt/sochi-portal-staging
EXTRACT=/var/tmp/yp-pre-extract
BUILDCTX=/var/tmp/yp-pre-buildctx
BUNDLE=/var/tmp/yp-staging-prebuilt.tgz

if [[ ! -d "$APP" ]]; then
  echo "ERROR: $APP missing" >&2
  exit 1
fi
if [[ ! -f "$BUNDLE" ]]; then
  echo "ERROR: $BUNDLE missing" >&2
  exit 1
fi

sudo -n mkdir -p "$EXTRACT" "$BUILDCTX"
sudo -n rm -rf "$EXTRACT"/* "$BUILDCTX"/* || true
sudo -n tar -xzf "$BUNDLE" -C "$EXTRACT"
sudo -n rm -f "$BUNDLE"

command -v rsync >/dev/null || sudo -n apt-get install -y -qq rsync

sudo -n rsync -a --delete \
  --exclude data/ \
  --exclude public/uploads/ \
  --exclude public/backups/ \
  --exclude .env \
  --exclude node_modules/ \
  --exclude .next/ \
  "$EXTRACT/" "$APP/"

sudo -n mkdir -p "$BUILDCTX/.next" "$BUILDCTX/certs"
sudo -n cp "$EXTRACT/Dockerfile.prebuilt" "$BUILDCTX/Dockerfile.prebuilt"
sudo -n cp -a "$EXTRACT/.next/standalone" "$BUILDCTX/.next/standalone"
sudo -n cp -a "$EXTRACT/.next/static" "$BUILDCTX/.next/static"
sudo -n cp -a "$EXTRACT/public" "$BUILDCTX/public"
sudo -n cp -a "$EXTRACT/prisma" "$BUILDCTX/prisma"
sudo -n cp "$EXTRACT/prisma.config.ts" "$BUILDCTX/prisma.config.ts"
sudo -n cp -a "$EXTRACT/scripts" "$BUILDCTX/scripts"
if [[ -d "$EXTRACT/certs" ]]; then
  sudo -n cp -a "$EXTRACT/certs" "$BUILDCTX/certs"
fi
if [[ -f "$APP/certs/russian_trusted_ca.pem" ]]; then
  sudo -n mkdir -p "$BUILDCTX/certs"
  sudo -n cp -a "$APP/certs/." "$BUILDCTX/certs/" || true
fi

cd "$APP"
# Cheap image: copy standalone, no next compile
sudo -n docker build -f "$BUILDCTX/Dockerfile.prebuilt" -t sochi-staging_web:latest "$BUILDCTX"
sudo -n docker compose -p sochi-staging -f docker-compose.staging.yml up -d --no-build web
sudo -n docker compose -p sochi-staging -f docker-compose.staging.yml exec -T web npx prisma db push --accept-data-loss || echo "WARN: prisma db push failed"

sudo -n rm -rf "$EXTRACT" "$BUILDCTX"
sleep 6
curl -sS --max-time 20 http://127.0.0.1:3001/api/health || true
echo
REMOTE

yp_scp "$REMOTE_SCRIPT" "$HOST:/var/tmp/yp-stg-pre-remote.sh"
rm -f "$REMOTE_SCRIPT"
yp_ssh "bash /var/tmp/yp-stg-pre-remote.sh; ec=\$?; rm -f /var/tmp/yp-stg-pre-remote.sh; exit \$ec"

echo "==> verify https://${STAGING_DOMAIN}/api/health == ${EXPECTED_VER}"
ok=0
for i in 1 2 3 4 5 6 7 8; do
  body="$(curl -fsS --max-time 25 "https://${STAGING_DOMAIN}/api/health" || true)"
  echo "  try $i: $body"
  if echo "$body" | grep -q "\"version\":\"${EXPECTED_VER}\""; then
    ok=1
    break
  fi
  sleep 4
done
if [[ "$ok" != "1" ]]; then
  echo "ERROR: staging version mismatch (expected $EXPECTED_VER)" >&2
  exit 1
fi
echo "==> ty ready https://${STAGING_DOMAIN}/"
