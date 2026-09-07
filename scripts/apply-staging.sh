#!/usr/bin/env bash
# One entrypoint: apply the current tree to https://ty.idivles.ru
# Never deploys production (py.idivles.ru).
#
#   bash scripts/apply-staging.sh           # auto: src → prebuilt, brand → static
#   bash scripts/apply-staging.sh prebuilt  # Next build here, cheap image on VPS
#   YP_REUSE_NEXT=1 … prebuilt              # skip next build if .next/standalone exists
#   bash scripts/apply-staging.sh static    # public/brand|icons|covers only
#   bash scripts/apply-staging.sh sync      # rsync source, no Docker rebuild
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib/vps.sh"

MODE="${1:-auto}"
STAGING_DOMAIN="${STAGING_DOMAIN:-ty.idivles.ru}"

auto_mode() {
  local diff
  diff="$(git diff --name-only origin/main...HEAD 2>/dev/null || git diff --name-only HEAD)"
  if echo "$diff" | grep -Eq '^(src/|prisma/|package.json|package-lock.json|next.config|public/sw\.js|Dockerfile)'; then
    echo prebuilt
    return
  fi
  if echo "$diff" | grep -Eq '^public/(brand|icons|covers)/'; then
    echo static
    return
  fi
  echo prebuilt
}

sync_static() {
  yp_init_ssh
  echo "==> static sync to ${STAGING_DOMAIN}"
  tar -C "$ROOT/public" -czf /tmp/yp-static-brand.tgz brand icons covers 2>/dev/null || tar -C "$ROOT/public" -czf /tmp/yp-static-brand.tgz brand
  yp_scp /tmp/yp-static-brand.tgz "$HOST:/tmp/yp-static-brand.tgz"
  yp_ssh 'sudo -n tar -xzf /tmp/yp-static-brand.tgz -C /opt/sochi-portal-staging/public && rm -f /tmp/yp-static-brand.tgz'
  rm -f /tmp/yp-static-brand.tgz
  echo "==> static files on disk; hard-refresh the browser (Ctrl+F5)"
}

build_prebuilt_here() {
  if [[ ! -d node_modules ]]; then
    echo "==> npm ci"
    npm ci
  fi
  export SKIP_DB_AT_BUILD=1
  export NEXT_TELEMETRY_DISABLED=1
  export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=4096}"
  schema_sha="$(sha256sum prisma/schema.prisma | awk '{print $1}')"
  client_sha_file="node_modules/.prisma/.schema-sha"
  if [[ -f node_modules/.prisma/client/index.js && -f "$client_sha_file" && "$(cat "$client_sha_file")" == "$schema_sha" ]]; then
    echo "==> prisma client already matches schema, skip generate"
  else
    echo "==> prisma generate"
    npx prisma generate
    mkdir -p node_modules/.prisma
    echo "$schema_sha" > "$client_sha_file"
  fi
  if [[ "${YP_REUSE_NEXT:-}" == "1" && -f .next/standalone/server.js ]]; then
    echo "==> YP_REUSE_NEXT=1, skip next build"
  else
    echo "==> next build (off the VPS)"
    npm run build
  fi
  bash "$ROOT/scripts/pack-staging-prebuilt.sh" /tmp/yp-staging-prebuilt.tgz
  bash "$ROOT/scripts/deploy-staging-prebuilt.sh" /tmp/yp-staging-prebuilt.tgz
}

if [[ "$MODE" == "auto" ]]; then
  MODE="$(auto_mode)"
  echo "==> auto mode: $MODE"
fi

case "$MODE" in
  --static|static)
    sync_static
    bash "$ROOT/scripts/smoke-sites.sh" --staging-only || true
    ;;
  --sync|sync)
    SKIP_BUILD=1 bash "$ROOT/scripts/workflow-deploy-staging.sh"
    ;;
  --prebuilt|prebuilt)
    build_prebuilt_here
    bash "$ROOT/scripts/smoke-sites.sh" --staging-only || true
    ;;
  -h|--help|help)
    sed -n '2,12p' "$0"
    ;;
  *)
    echo "Unknown mode: $MODE" >&2
    exit 1
    ;;
esac
