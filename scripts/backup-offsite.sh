#!/usr/bin/env bash
# Copy latest local backups to off-box object storage (S3-compatible).
# Configure rclone remote once, then set BACKUP_RCLONE_REMOTE in /etc/yp-portal/backup.env
# Example: BACKUP_RCLONE_REMOTE=yp-s3:youngportal-backups
set -euo pipefail
DIR="/var/backups/sochi-portal"
ENVF="${BACKUP_ENV_FILE:-/etc/yp-portal/backup.env}"
if [[ -f "$ENVF" ]]; then
  # shellcheck disable=SC1090
  source "$ENVF"
fi
REMOTE="${BACKUP_RCLONE_REMOTE:-}"
if [[ -z "$REMOTE" ]]; then
  echo "skip offsite: BACKUP_RCLONE_REMOTE not set"
  exit 0
fi
if ! command -v rclone >/dev/null 2>&1; then
  echo "ERROR: rclone not installed; backups stay on this disk only" >&2
  exit 1
fi
LATEST_DB="$(ls -1t "$DIR"/db-*.dump 2>/dev/null | head -1 || true)"
LATEST_FULL="$(ls -1t "$DIR"/full-*.tar.gz 2>/dev/null | head -1 || true)"
[[ -n "$LATEST_DB" ]] && rclone copy "$LATEST_DB" "$REMOTE/" --quiet
[[ -n "$LATEST_FULL" ]] && rclone copy "$LATEST_FULL" "$REMOTE/" --quiet
echo "offsite ok -> $REMOTE"
