#!/usr/bin/env bash
# Copy live .env files into a root-only vault on THIS VPS.
# Values never go into the public kit. Run on the YoungPortal server as root.
#
#   sudo bash scripts/stash-server-secrets.sh
set -euo pipefail

SECRETS="${SECRETS_DIR:-/var/backups/sochi-portal/secrets}"
PROD_APP="${PROD_APP:-/opt/sochi-portal}"
STAGING_APP="${STAGING_APP:-/opt/sochi-portal-staging}"

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Run as root (sudo)." >&2
  exit 1
fi

install -d -m 700 -o root -g root "$SECRETS"

copy_env() {
  local src="$1" dest="$2" label="$3"
  if [[ ! -f "$src" ]]; then
    echo "WARN: no $label at $src" >&2
    return 0
  fi
  install -m 600 -o root -g root "$src" "$dest"
  local n
  n="$(grep -cE '^[A-Z0-9_]+=' "$dest" || true)"
  echo "stashed $label → $dest ($n keys, $(wc -c < "$dest") bytes)"
}

copy_env "$PROD_APP/.env" "$SECRETS/prod.env" "prod .env"
copy_env "$STAGING_APP/.env" "$SECRETS/staging.env" "staging .env"

HERE="$(cd "$(dirname "$0")" && pwd)"
if [[ -f "$HERE/place-server-secrets.sh" ]]; then
  install -m 700 -o root -g root "$HERE/place-server-secrets.sh" "$SECRETS/place-server-secrets.sh"
fi

{
  echo "YoungPortal secrets vault"
  echo "Updated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "This directory stays on the VPS (mode 700). Not published."
  echo "Restore onto live paths:"
  echo "  sudo bash $SECRETS/place-server-secrets.sh"
  echo "  sudo RESTART=1 bash $SECRETS/place-server-secrets.sh"
} > "$SECRETS/README.txt"
chmod 600 "$SECRETS/README.txt"

echo "OK vault=$SECRETS"
ls -la "$SECRETS"
