#!/usr/bin/env bash
# Install YoungPortal from a source-free runtime kit (Docker image + dump).
# Run from kit root: sudo bash INSTALL.sh
set -euo pipefail

KIT_ROOT="$(cd "$(dirname "$0")" && pwd)"
[[ -f "$KIT_ROOT/INSTALL.sh" ]] || KIT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APP_DIR="${APP_DIR:-/opt/sochi-portal}"
PROD_DOMAIN="${PROD_DOMAIN:-${DOMAIN:-portal.example.ru}}"
SNAPSHOT="${KIT_ROOT}/snapshot"
COMPOSE_FILE="${KIT_ROOT}/deploy/docker-compose.runtime.yml"

die() { echo "ERROR: $*" >&2; exit 1; }
need_root() { [[ "$(id -u)" -eq 0 ]] || die "run as root"; }

yp_compose() {
  if command -v docker-compose >/dev/null 2>&1; then
    docker-compose -f docker-compose.yml "$@"
  else
    docker compose -f docker-compose.yml "$@"
  fi
}

write_env() {
  local dest="$1"
  local pg redis auth
  pg="$(openssl rand -hex 18)"
  redis="$(openssl rand -hex 18)"
  auth="$(openssl rand -hex 32)"
  cat > "$dest" <<EOF
POSTGRES_USER=sochi
POSTGRES_PASSWORD=${pg}
POSTGRES_DB=sochi_portal
REDIS_PASSWORD=${redis}
REDIS_URL=redis://:${redis}@redis:6379
NEXTAUTH_URL=https://${PROD_DOMAIN}
NEXTAUTH_SECRET=${auth}
EMAIL_SMTP_BLOCKED=1
NODE_ENV=production
EOF
  chmod 600 "$dest"
}

need_root
command -v docker >/dev/null 2>&1 || die "install Docker first"
[[ -f "$SNAPSHOT/images.tar.gz" ]] || die "missing snapshot/images.tar.gz"
[[ -f "$COMPOSE_FILE" ]] || die "missing deploy/docker-compose.runtime.yml"

echo "==> install runtime kit → ${APP_DIR}  domain=${PROD_DOMAIN}"
mkdir -p "$APP_DIR/public/uploads" "$APP_DIR/data/postgres" "$APP_DIR/certs" "$APP_DIR/deploy"
cp -f "$COMPOSE_FILE" "$APP_DIR/docker-compose.yml"
cp -f "$KIT_ROOT/deploy/"*.tpl "$APP_DIR/deploy/" 2>/dev/null || true
cp -f "$KIT_ROOT/deploy/nginx-yp-limits.conf" "$APP_DIR/deploy/" 2>/dev/null || true
cp -f "$KIT_ROOT/deploy/fail2ban-yp-nginx.local" "$APP_DIR/deploy/" 2>/dev/null || true
if [[ -f "$KIT_ROOT/certs/russian_trusted_ca.pem" ]]; then
  cp -f "$KIT_ROOT/certs/russian_trusted_ca.pem" "$APP_DIR/certs/"
fi
if [[ ! -f "$APP_DIR/.env" ]]; then
  write_env "$APP_DIR/.env"
  echo "  wrote new $APP_DIR/.env (secrets generated; not from the kit)"
else
  echo "  keep existing $APP_DIR/.env"
fi

echo "==> docker load (this takes a while)"
gunzip -c "$SNAPSHOT/images.tar.gz" | docker load
docker image inspect sochi-portal_web:latest >/dev/null 2>&1 || die "sochi-portal_web:latest missing after load"

cd "$APP_DIR"
yp_compose up -d db redis
for i in $(seq 1 60); do
  yp_compose exec -T db pg_isready >/dev/null 2>&1 && break
  sleep 2
done
yp_compose exec -T db pg_isready >/dev/null 2>&1 || die "Postgres not ready"

if [[ -f "$SNAPSHOT/uploads.tgz" ]]; then
  tar -xzf "$SNAPSHOT/uploads.tgz" -C "$APP_DIR/public"
fi
if [[ -f "$SNAPSHOT/db.dump" ]]; then
  echo "==> pg_restore"
  yp_compose exec -T db psql -U sochi -d postgres -v ON_ERROR_STOP=1 -c \
    "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname='sochi_portal' AND pid <> pg_backend_pid();" \
    >/dev/null 2>&1 || true
  docker exec -i "$(yp_compose ps -q db)" pg_restore -U sochi -d sochi_portal --clean --if-exists --no-owner \
    < "$SNAPSHOT/db.dump" || echo "WARN: pg_restore warnings (often OK)"
fi

yp_compose up -d --no-build web
sleep 8
curl -fsS --max-time 8 http://127.0.0.1:3000/api/health || echo "WARN: health not ready yet"
echo "OK. Next: nginx + certbot for https://${PROD_DOMAIN} → 127.0.0.1:3000"
echo "See README.txt — no source tree was installed."
