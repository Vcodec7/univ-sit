#!/usr/bin/env bash
# Install a prebuilt Next standalone bundle onto STAGING (ty.idivles.ru).
# Does not run `next build` on the 2GB VPS. Does not touch production (py).
#
# Expects a tarball at $1 (or /tmp/yp-staging-prebuilt.tgz) with:
#   Dockerfile.prebuilt, .next/standalone, .next/static, public, prisma,
#   prisma.config.ts, scripts
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
BUNDLE=/var/tmp/yp-staging-prebuilt.tgz

if [[ ! -d "$APP" ]]; then
  echo "ERROR: $APP missing" >&2
  exit 1
fi
if [[ ! -f "$BUNDLE" ]]; then
  echo "ERROR: $BUNDLE missing" >&2
  exit 1
fi

sudo -n mkdir -p "$EXTRACT"
sudo -n rm -rf "$EXTRACT"/* || true
sudo -n tar -xzf "$BUNDLE" -C "$EXTRACT"
sudo -n rm -f "$BUNDLE"

command -v rsync >/dev/null || sudo -n apt-get install -y -qq rsync

# Host copy is only for nginx /brand and compose files — not the 200MB standalone.
sudo -n mkdir -p "$APP/public" "$APP/prisma" "$APP/scripts"
sudo -n rsync -a "$EXTRACT/Dockerfile.prebuilt" "$APP/Dockerfile.prebuilt"
if [[ -f "$EXTRACT/docker-compose.staging.yml" ]]; then
  sudo -n rsync -a "$EXTRACT/docker-compose.staging.yml" "$APP/docker-compose.staging.yml"
fi
sudo -n rsync -a "$EXTRACT/prisma/" "$APP/prisma/"
if [[ -f "$EXTRACT/scripts/prisma-push.config.mjs" ]]; then
  sudo -n mkdir -p "$APP/scripts"
  sudo -n rsync -a "$EXTRACT/scripts/prisma-push.config.mjs" "$APP/scripts/prisma-push.config.mjs"
fi
if [[ -d "$EXTRACT/public/brand" ]]; then
  sudo -n rsync -a "$EXTRACT/public/brand/" "$APP/public/brand/"
fi
if [[ -d "$EXTRACT/public/icons" ]]; then
  sudo -n rsync -a "$EXTRACT/public/icons/" "$APP/public/icons/"
fi
if [[ -d "$EXTRACT/public/covers" ]]; then
  sudo -n rsync -a "$EXTRACT/public/covers/" "$APP/public/covers/"
fi

if [[ -f "$EXTRACT/prisma.config.ts" ]]; then
  sudo -n rsync -a "$EXTRACT/prisma.config.ts" "$APP/prisma.config.ts"
fi

NEW_SHA="$(sha256sum "$EXTRACT/prisma/schema.prisma" | awk '{print $1}')"
OLD_SHA="$(sudo -n cat "$APP/.yp-schema-sha" 2>/dev/null || true)"

cd "$APP"
# Host uploads are bind-mounted read-write; node uid 1000 must own them to issue PDFs.
sudo -n mkdir -p /opt/sochi-portal/public/uploads/awards
sudo -n chown -R 1000:1000 /opt/sochi-portal/public/uploads 2>/dev/null || sudo -n chmod -R a+rwX /opt/sochi-portal/public/uploads
sudo -n docker build -f "$EXTRACT/Dockerfile.prebuilt" -t sochi-staging_web:latest "$EXTRACT"
sudo -n docker compose -p sochi-staging -f docker-compose.staging.yml up -d --no-build web

if [[ "$NEW_SHA" == "$OLD_SHA" ]]; then
  echo "==> prisma schema unchanged, skip db push"
else
  echo "==> prisma schema changed, db push (additive, no data-loss flag)"
  pushed=0
  if sudo -n docker compose -p sochi-staging -f docker-compose.staging.yml exec -T web \
      sh -c 'test -x ./node_modules/.bin/prisma && ./node_modules/.bin/prisma db push'; then
    pushed=1
  elif [[ -f "$APP/.env" && -f "$APP/prisma/schema.prisma" ]]; then
    echo "==> prisma CLI missing in web image, one-shot node container"
    if sudo -n docker run --rm \
        --network sochi-portal_default \
        --env-file "$APP/.env" \
        -v "$APP/prisma:/work/prisma:ro" \
        -v "$APP/scripts/prisma-push.config.mjs:/work/prisma.config.mjs:ro" \
        -w /work \
        node:22-bookworm-slim \
        sh -c 'npx --yes prisma@7.9.1 db push --config prisma.config.mjs --accept-data-loss'; then
      pushed=1
    fi
  fi
  if [[ "$pushed" == "1" ]]; then
    echo "$NEW_SHA" | sudo -n tee "$APP/.yp-schema-sha" >/dev/null
  else
    echo "WARN: prisma schema not applied. Image still started." >&2
  fi
fi

sudo -n rm -rf "$EXTRACT"

echo "==> wait localhost:3001"
ok=0
for i in 1 2 3 4 5 6 7 8 9 10 12 14; do
  body="$(curl -sS --max-time 3 http://127.0.0.1:3001/api/health || true)"
  if echo "$body" | grep -q '"ok":true'; then
    echo "$body"
    ok=1
    break
  fi
  sleep 2
done
if [[ "$ok" != "1" ]]; then
  echo "ERROR: staging web did not become healthy on :3001" >&2
  sudo -n docker compose -p sochi-staging -f docker-compose.staging.yml logs --tail 40 web || true
  exit 1
fi
REMOTE

yp_scp "$REMOTE_SCRIPT" "$HOST:/var/tmp/yp-stg-pre-remote.sh"
rm -f "$REMOTE_SCRIPT"
yp_ssh "bash /var/tmp/yp-stg-pre-remote.sh; ec=\$?; rm -f /var/tmp/yp-stg-pre-remote.sh; exit \$ec"

echo "==> verify https://${STAGING_DOMAIN}/api/health == ${EXPECTED_VER}"
ok=0
for i in 1 2 3 4 5 6; do
  body="$(curl -fsS --max-time 12 "https://${STAGING_DOMAIN}/api/health" || true)"
  echo "  try $i: $body"
  if echo "$body" | grep -q "\"version\":\"${EXPECTED_VER}\""; then
    ok=1
    break
  fi
  sleep 3
done
if [[ "$ok" != "1" ]]; then
  echo "ERROR: staging version mismatch (expected $EXPECTED_VER)" >&2
  exit 1
fi
echo "==> ty ready https://${STAGING_DOMAIN}/"
