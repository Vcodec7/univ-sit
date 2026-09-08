#!/usr/bin/env bash
# Place stashed .env files back onto the live app directories.
# Secrets live only on the VPS: /var/backups/sochi-portal/secrets/
# They are NOT inside the public download kit.
#
#   sudo bash scripts/place-server-secrets.sh
#   sudo RESTART=1 bash /var/backups/sochi-portal/secrets/place-server-secrets.sh
#
# Optional:
#   SECRETS_DIR=… PROD_APP=… STAGING_APP=… DRY_RUN=1
set -euo pipefail

SECRETS="${SECRETS_DIR:-/var/backups/sochi-portal/secrets}"
PROD_APP="${PROD_APP:-/opt/sochi-portal}"
STAGING_APP="${STAGING_APP:-/opt/sochi-portal-staging}"
DRY="${DRY_RUN:-0}"
RESTART="${RESTART:-0}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

if [[ ! -d "$SECRETS" ]]; then
  echo "Missing vault $SECRETS — run stash-server-secrets.sh on this VPS first." >&2
  exit 1
fi

place() {
  local src="$1" dest="$2" label="$3"
  if [[ ! -f "$src" ]]; then
    echo "SKIP $label (no $src)"
    return 0
  fi
  mkdir -p "$(dirname "$dest")"
  if [[ "$DRY" == "1" ]]; then
    echo "would place $label → $dest ($(wc -c < "$src") bytes)"
    return 0
  fi
  if [[ -f "$dest" ]]; then
    install -m 600 -o root -g root "$dest" "${dest}.bak.$(date -u +%Y%m%d%H%M%S)"
  fi
  install -m 600 -o root -g root "$src" "$dest"
  local n
  n="$(grep -cE '^[A-Z0-9_]+=' "$dest" || true)"
  echo "placed $label → $dest ($n keys)"
}

place "$SECRETS/prod.env" "$PROD_APP/.env" "prod"
place "$SECRETS/staging.env" "$STAGING_APP/.env" "staging"

if [[ "$DRY" == "1" || "$RESTART" != "1" ]]; then
  echo "Done. Containers not restarted (set RESTART=1 to recreate web from env_file)."
  exit 0
fi

if [[ -f "$PROD_APP/docker-compose.yml" ]]; then
  (cd "$PROD_APP" && docker compose up -d --no-build --force-recreate web) || \
    (cd "$PROD_APP" && docker-compose up -d --no-build --force-recreate web) || true
fi
if [[ -f "$STAGING_APP/docker-compose.staging.yml" ]]; then
  (cd "$STAGING_APP" && docker compose -f docker-compose.staging.yml up -d --no-build --force-recreate web) || true
fi
echo "Restart requested. Check: curl -sS http://127.0.0.1:3000/api/health"
