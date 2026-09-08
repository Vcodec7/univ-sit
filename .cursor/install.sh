#!/usr/bin/env bash
# Cloud Agent install: idempotent dev-environment bootstrap for sochi-portal.
# Installs system deps (PostgreSQL), prepares the local DB, installs npm
# packages, generates the Prisma client, syncs the schema and seeds demo data.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

PG_VERSION="16"
DB_USER="sochi"
DB_PASSWORD="sochi"
DB_NAME="sochi_portal"

echo "==> [1/6] System packages (PostgreSQL)"
if ! command -v pg_ctlcluster >/dev/null 2>&1; then
  sudo apt-get update -y
  sudo DEBIAN_FRONTEND=noninteractive apt-get install -y postgresql postgresql-contrib
fi

echo "==> [2/6] Start PostgreSQL cluster"
sudo pg_ctlcluster "$PG_VERSION" main start 2>/dev/null || true
for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 >/dev/null 2>&1 && break
  sleep 1
done

echo "==> [3/6] Ensure role and database exist"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASSWORD}';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 \
  || sudo -u postgres createdb -O "${DB_USER}" "${DB_NAME}"

echo "==> [4/6] Ensure .env exists"
if [ ! -f .env ]; then
  cat > .env <<EOF
NODE_ENV=development
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@127.0.0.1:5432/${DB_NAME}?schema=public
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=$(openssl rand -hex 32)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
EOF
  echo "    wrote .env"
else
  echo "    .env already present — leaving it untouched"
fi

echo "==> [5/6] Install npm dependencies"
npm ci

echo "==> [6/6] Prisma client, schema sync and demo seed"
npx prisma generate
npx prisma db push
npm run db:seed

echo "==> install complete"
