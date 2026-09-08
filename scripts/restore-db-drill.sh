#!/usr/bin/env bash
# Test restore of a pg_dump -Fc file into a throwaway Postgres container.
# Usage: bash scripts/restore-db-drill.sh [/var/backups/sochi-portal/db-….dump]
set -euo pipefail
DUMP="${1:-}"
if [[ -z "$DUMP" ]]; then
  DUMP="$(ls -1t /var/backups/sochi-portal/db-*.dump 2>/dev/null | head -1 || true)"
fi
if [[ -z "$DUMP" || ! -f "$DUMP" ]]; then
  echo "Usage: $0 path/to/db.dump" >&2
  exit 1
fi
NAME="yp-restore-drill-$$"
cleanup() { docker rm -f "$NAME" >/dev/null 2>&1 || true; }
trap cleanup EXIT
docker run -d --name "$NAME" -e POSTGRES_PASSWORD=drill -e POSTGRES_USER=sochi -e POSTGRES_DB=sochi_portal postgres:16-alpine >/dev/null
for _ in $(seq 1 40); do
  if docker exec "$NAME" pg_isready -U sochi >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec -i "$NAME" pg_restore -U sochi -d sochi_portal --clean --if-exists < "$DUMP"
COUNT="$(docker exec "$NAME" psql -U sochi -d sochi_portal -tAc 'SELECT count(*) FROM "User"' | tr -d '[:space:]')"
if [[ ! "$COUNT" =~ ^[0-9]+$ ]]; then
  echo "FAIL: restore did not yield User table" >&2
  exit 1
fi
echo "OK restore drill: User rows=$COUNT from $(basename "$DUMP")"
