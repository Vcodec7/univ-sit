#!/usr/bin/env bash
# Cloud Agent start: bring PostgreSQL up on every boot before the dev server.
# Idempotent — safe to run when the cluster is already running.
set -euo pipefail

PG_VERSION="16"

sudo pg_ctlcluster "$PG_VERSION" main start 2>/dev/null || true
for _ in $(seq 1 30); do
  pg_isready -h 127.0.0.1 >/dev/null 2>&1 && break
  sleep 1
done

pg_isready -h 127.0.0.1 || {
  echo "PostgreSQL did not become ready" >&2
  exit 1
}
echo "PostgreSQL is ready on 127.0.0.1:5432"
