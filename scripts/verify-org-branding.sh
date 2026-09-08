#!/usr/bin/env bash
# After install: check SiteSettings / NEXTAUTH_URL match the org, not the Sochi template.
set -euo pipefail
APP_DIR="${APP_DIR:-/opt/sochi-portal}"
SITE_NAME="${SITE_NAME:-}"
PUBLIC_URL="${PUBLIC_URL:-}"
PROD_DOMAIN="${PROD_DOMAIN:-}"
REPORT="${REPORT_FILE:-/etc/yp-portal/branding-check.txt}"
mkdir -p "$(dirname "$REPORT")" 2>/dev/null || true

fail=0
notes=()

db_ctr() {
  docker ps --format '{{.Names}}' | grep -E 'sochi-portal(_|-)db' | head -1 || true
}

row=""
CTR="$(db_ctr)"
if [[ -n "$CTR" ]]; then
  row="$(docker exec "$CTR" psql -U sochi -d sochi_portal -Atqc \
    "SELECT coalesce(\"siteName\",'') || '|' || coalesce(\"publicSiteUrl\",'') || '|' || coalesce(\"contactEmail\",'') FROM \"SiteSettings\" WHERE id='1';" \
    2>/dev/null || true)"
fi

db_name="${row%%|*}"; rest="${row#*|}"
db_url="${rest%%|*}"; db_mail="${rest#*|}"

leftover_re='idivles\.ru|young\.idivles|y1\.idivles|молодёжь сочи|молодежь сочи'

check_leftover() {
  local label="$1" val="$2"
  local low
  low="$(printf '%s' "$val" | tr '[:upper:]' '[:lower:]')"
  if printf '%s' "$low" | grep -Eq "$leftover_re"; then
    notes+=("LEFTOVER $label: $val")
    fail=1
  fi
}

check_leftover siteName "${db_name:-}"
check_leftover publicSiteUrl "${db_url:-}"
check_leftover contactEmail "${db_mail:-}"

if [[ -n "$SITE_NAME" && -n "$db_name" && "$db_name" != "$SITE_NAME" ]]; then
  notes+=("MISMATCH siteName DB='$db_name' expected='$SITE_NAME'")
  fail=1
fi
if [[ -n "$PUBLIC_URL" && -n "$db_url" && "$db_url" != "$PUBLIC_URL" ]]; then
  notes+=("MISMATCH publicSiteUrl DB='$db_url' expected='$PUBLIC_URL'")
  fail=1
fi

if [[ -f "$APP_DIR/.env" ]]; then
  nu="$(grep -E '^NEXTAUTH_URL=' "$APP_DIR/.env" | tail -1 | cut -d= -f2- | tr -d '"' || true)"
  if [[ -n "$PUBLIC_URL" && -n "$nu" && "$nu" != "$PUBLIC_URL" ]]; then
    notes+=("MISMATCH NEXTAUTH_URL='$nu' expected='$PUBLIC_URL'")
    fail=1
  fi
  check_leftover NEXTAUTH_URL "$nu"
fi

{
  echo "YoungPortal branding check $(date -u +%Y-%m-%dT%H:%M:%SZ)"
  echo "siteName(DB)=${db_name:-?}"
  echo "publicSiteUrl(DB)=${db_url:-?}"
  echo "expected SITE_NAME=${SITE_NAME}"
  echo "expected PUBLIC_URL=${PUBLIC_URL}"
  echo "PROD_DOMAIN=${PROD_DOMAIN}"
  if [[ "$fail" == "0" ]]; then
    echo "RESULT=OK — шаблон Сочи/idivles в отображаемых полях не найден; имя и URL совпадают."
  else
    echo "RESULT=WARN"
    printf '%s\n' "${notes[@]}"
  fi
} | tee "$REPORT" 2>/dev/null || true

exit 0
