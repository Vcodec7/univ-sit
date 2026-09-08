#!/usr/bin/env bash
# Pack a source-free org runtime kit: Docker images + dump + compose/nginx.
# No src/, no .git, no live .env values. See docs/ORG-RUNTIME-KIT.txt.
#
#   bash scripts/pack-org-runtime-kit.sh
#   bash scripts/pack-org-runtime-kit.sh --skip-publish --out-dir ./artifacts
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib/vps.sh"

STAMP="$(date -u +%Y%m%d-%H%M%S)"
OUT_DIR="${ARTIFACTS_DIR:-$ROOT/artifacts}"
SKIP_PUBLISH=0
KIT_PREFIX="youngportal-org-runtime-kit"
NAME="${KIT_PREFIX}-${STAMP}"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --skip-publish) SKIP_PUBLISH=1; shift ;;
    --stamp) STAMP="$2"; NAME="${KIT_PREFIX}-${STAMP}"; shift 2 ;;
    --out-dir) OUT_DIR="$2"; shift 2 ;;
    -h|--help) sed -n '2,12p' "$0" | sed 's/^# \?//'; exit 0 ;;
    *) echo "Unknown: $1" >&2; exit 1 ;;
  esac
done

APP_VER="$(python3 - "$ROOT/package.json" <<'PY'
import json, pathlib, sys
print(json.loads(pathlib.Path(sys.argv[1]).read_text()).get("version", "unknown"))
PY
)"
GIT_SHA="$(git -C "$ROOT" rev-parse --short HEAD 2>/dev/null || echo unknown)"
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
STAGE="/tmp/${NAME}"
rm -rf "$STAGE"
mkdir -p "$STAGE/snapshot" "$STAGE/deploy" "$STAGE/certs" "$STAGE/docs"

cp -f "$ROOT/docker-compose.runtime.yml" "$STAGE/deploy/docker-compose.runtime.yml"
cp -f "$ROOT/deploy/nginx-dual-site.conf.tpl" "$STAGE/deploy/"
cp -f "$ROOT/deploy/nginx-clone-site.conf.tpl" "$STAGE/deploy/"
cp -f "$ROOT/deploy/nginx-yp-limits.conf" "$STAGE/deploy/"
cp -f "$ROOT/deploy/fail2ban-yp-nginx.local" "$STAGE/deploy/"
cp -f "$ROOT/LICENSE" "$STAGE/LICENSE"
cp -f "$ROOT/docs/ORG-RUNTIME-KIT.txt" "$STAGE/README.txt"
cp -f "$ROOT/docs/ORG-RUNTIME-KIT.txt" "$STAGE/docs/"
cp -f "$ROOT/scripts/install-org-runtime.sh" "$STAGE/INSTALL.sh"
chmod +x "$STAGE/INSTALL.sh"
cp -f "$STAGE/INSTALL.sh" "$STAGE/START.sh"
if [[ -f "$ROOT/certs/russian_trusted_ca.pem" ]]; then
  cp -f "$ROOT/certs/russian_trusted_ca.pem" "$STAGE/certs/"
fi

cat > "$STAGE/.env.example" <<'EOF'
# Generate your own values. Live secrets are never packed in this kit.
POSTGRES_USER=sochi
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=sochi_portal
REDIS_PASSWORD=CHANGE_ME
REDIS_URL=redis://:CHANGE_ME@redis:6379
NEXTAUTH_URL=https://portal.example.ru
NEXTAUTH_SECRET=CHANGE_ME_LONG_RANDOM
EMAIL_SMTP_BLOCKED=1
NODE_ENV=production
EOF

cat > "$STAGE/VERSION.json" <<EOF
{
  "kit": "${KIT_PREFIX}",
  "name": "${NAME}",
  "role": "org-runtime",
  "sourceTreeIncluded": false,
  "secretsIncluded": false,
  "packedAt": "${NOW}",
  "appVersion": "${APP_VER}",
  "gitSha": "${GIT_SHA}",
  "protection": "No application TypeScript/source tree. Runtime is a Docker image; reverse-engineering is possible. Not DRM."
}
EOF

echo "==> Live snapshot (db + uploads + docker save) from VPS"
yp_init_ssh
LIVE_SNAP_REMOTE=/var/backups/sochi-portal/yp-org-runtime-snap
PACK_LOCAL=/tmp/yp-org-runtime-live.sh
cat > "$PACK_LOCAL" <<'REMOTE'
#!/usr/bin/env bash
set -euo pipefail
SNAP="$1"
APP="${APP_DIR:-/opt/sochi-portal}"
mkdir -p "$SNAP"
if docker ps --format '{{.Names}}' | grep -Eq '^sochi-portal(_|-)db'; then
  DB="$(docker ps --format '{{.Names}}' | grep -E '^sochi-portal(_|-)db' | head -1)"
  docker exec "$DB" pg_dump -U sochi -Fc sochi_portal > "$SNAP/db.dump"
else
  echo "WARN: no prod db container" >&2
fi
if [[ -d "$APP/public/uploads" ]]; then
  tar -czf "$SNAP/uploads.tgz" -C "$APP/public" uploads
else
  empty="$(mktemp -d /var/tmp/yp-empty-uploads.XXXXXX)"
  mkdir -p "$empty/uploads"
  tar -czf "$SNAP/uploads.tgz" -C "$empty" uploads
  rm -rf "$empty"
fi
WEB_IMG=""
if docker image inspect sochi-portal_web:latest >/dev/null 2>&1; then
  WEB_IMG="sochi-portal_web:latest"
elif docker image inspect sochi-portal-web:latest >/dev/null 2>&1; then
  docker tag sochi-portal-web:latest sochi-portal_web:latest || true
  WEB_IMG="sochi-portal_web:latest"
else
  RUNNING="$(docker ps --filter name=sochi-portal.web --format '{{.Image}}' | head -1 || true)"
  if [[ -n "$RUNNING" ]]; then
    docker tag "$RUNNING" sochi-portal_web:latest || true
    WEB_IMG="sochi-portal_web:latest"
  fi
fi
SAVE_IMGS=(postgres:16-alpine redis:7-alpine)
[[ -n "$WEB_IMG" ]] && SAVE_IMGS+=("$WEB_IMG")
if docker image inspect sochi-staging_web:latest >/dev/null 2>&1; then
  SAVE_IMGS+=(sochi-staging_web:latest)
fi
docker save "${SAVE_IMGS[@]}" | gzip -1 > "$SNAP/images.tar.gz"
if [[ -f "$APP/.env" ]]; then
  grep -E '^[A-Z0-9_]+=' "$APP/.env" | cut -d= -f1 | sort > "$SNAP/env-keys.txt"
fi
NOW="$(date -u +%Y-%m-%dT%H:%M:%SZ)"
HEALTH="$(curl -sS --max-time 8 http://127.0.0.1:3000/api/health 2>/dev/null || echo '{}')"
{
  echo "Runtime snapshot packed: ${NOW}"
  echo "Health: ${HEALTH}"
  echo "images: ${SAVE_IMGS[*]}"
  echo "No .env values included."
} >> "$SNAP/MANIFEST.txt"
echo "LIVE_OK=1"
REMOTE
chmod +x "$PACK_LOCAL"
yp_ssh "sudo mkdir -p '$LIVE_SNAP_REMOTE' /var/tmp && sudo rm -rf '${LIVE_SNAP_REMOTE:?}'/*"
yp_put_root "$PACK_LOCAL" "/var/tmp/yp-org-runtime-live.sh"
yp_ssh "sudo chmod +x /var/tmp/yp-org-runtime-live.sh && sudo bash /var/tmp/yp-org-runtime-live.sh '$LIVE_SNAP_REMOTE'"
yp_get_root "${LIVE_SNAP_REMOTE}/db.dump" "$STAGE/snapshot/db.dump" || true
yp_get_root "${LIVE_SNAP_REMOTE}/uploads.tgz" "$STAGE/snapshot/uploads.tgz" || true
yp_get_root "${LIVE_SNAP_REMOTE}/images.tar.gz" "$STAGE/snapshot/images.tar.gz" || true
yp_get_root "${LIVE_SNAP_REMOTE}/env-keys.txt" "$STAGE/snapshot/env-keys.txt" || true
yp_ssh "sudo cat '${LIVE_SNAP_REMOTE}/MANIFEST.txt'" >> "$STAGE/snapshot/MANIFEST.txt" || true
yp_ssh "sudo rm -rf '${LIVE_SNAP_REMOTE}' /var/tmp/yp-org-runtime-live.sh" || true
rm -f "$PACK_LOCAL"

[[ -f "$STAGE/snapshot/images.tar.gz" ]] || { echo "ERROR: images.tar.gz missing" >&2; exit 1; }

# Guard: no TypeScript app source
if find "$STAGE" -name '*.tsx' -o -name 'schema.prisma' | grep -q .; then
  echo "ERROR: source files leaked into runtime kit" >&2
  exit 1
fi

mkdir -p "$OUT_DIR"
ARCHIVE="${OUT_DIR}/${NAME}.tgz"
echo "[kit] compress $ARCHIVE"
tar -czf "$ARCHIVE" -C "$(dirname "$STAGE")" "$(basename "$STAGE")"
sha256sum "$ARCHIVE" | tee "${ARCHIVE}.sha256"
ln -sfn "$ARCHIVE" "${OUT_DIR}/${KIT_PREFIX}-latest.tgz" || true
rm -rf "$STAGE"

PUBLISHED_URL=""
if [[ "$SKIP_PUBLISH" != "1" ]]; then
  PUBLIC_ORIGIN="${PUBLIC_ORIGIN:-https://py.idivles.ru}"
  yp_scp "$ARCHIVE" "$HOST:/var/backups/sochi-portal/${NAME}.tgz"
  yp_scp "${ARCHIVE}.sha256" "$HOST:/var/backups/sochi-portal/${NAME}.tgz.sha256" || true
  yp_ssh "ln -sfn /var/backups/sochi-portal/${NAME}.tgz /var/backups/sochi-portal/${KIT_PREFIX}-latest.tgz"
  PUB_OUT="$(yp_ssh "PUBLIC_ORIGIN=${PUBLIC_ORIGIN} bash /opt/sochi-portal/scripts/publish-public-backup.sh /var/backups/sochi-portal/${NAME}.tgz" || true)"
  echo "$PUB_OUT"
  PUBLISHED_URL="$(echo "$PUB_OUT" | grep -E '^URL=' | tail -1 | cut -d= -f2- || true)"
fi

echo "LOCAL_ARCHIVE=${ARCHIVE}"
echo "PUBLISHED_URL=${PUBLISHED_URL:-}"
echo "KIT=${NAME} version=${APP_VER} git=${GIT_SHA}"
