#!/usr/bin/env bash
# Скачать YoungPortal kit ТОЛЬКО с IP хранилища бэкапов (77.110.125.241).
#
# Клиент (по умолчанию):
#   bash scripts/download-kit.sh
#   bash scripts/download-kit.sh /root/yp-kit/kit.tgz
#
# Организация (код + живой контент БД/uploads):
#   KIT_PROFILE=org bash scripts/download-kit.sh
#
# Исходник для модернизации:
#   KIT_PROFILE=source bash scripts/download-kit.sh
#
# Разработчик (полный эталон исходников, без node_modules):
#   KIT_PROFILE=developer bash scripts/download-kit.sh
#
# Живой VPS (Docker-образы + /app с node_modules + БД + uploads):
#   KIT_PROFILE=server bash scripts/download-kit.sh
#
# Свой token/path:
#   KIT_URL='https://77.110.125.241/backups/<token>/file.tgz' bash scripts/download-kit.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
# shellcheck disable=SC1091
source "$ROOT/scripts/lib/kit-download.sh"

KIT_STORAGE_IP="${KIT_STORAGE_IP:-77.110.125.241}"
KIT_PROFILE="${KIT_PROFILE:-client}"
OUT="${1:-./youngportal-kit.tgz}"

case "$KIT_PROFILE" in
  client|slim)
    KIT_URL="${KIT_URL:-https://${KIT_STORAGE_IP}/backups/98c517ba79be6e0a8f82a63293dbc64c/youngportal-client-kit-20260815-100750.tgz}"
    KIT_SHA256="${KIT_SHA256:-fc3711f8a3f7f4e806e67349413a2a49ac908b7a2908e1ecfde018b42e026a1d}"
    ;;
  org|organization|with-live)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/5583708ce4551ad7f13f10ae484a5130/youngportal-org-kit-20260908-134736.tgz}"
    KIT_SHA256="${KIT_SHA256:-707d8c530172fdfc301ff5f08d300b79195f277d5095150b72656657464f3060}"
    ;;
  runtime|org-runtime|nosource)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/f897e77da076d7363a67ba67035ad4a3/youngportal-org-runtime-kit-20260908-134736.tgz}"
    KIT_SHA256="${KIT_SHA256:-36d16b4947720362a2b212157c47e2a0360747b31f992f50c577cc6b9aa82fcc}"
    ;;
  server|server-full|live-full)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/e8557e9d7dcbb9b7d968d28af3e43c8d/youngportal-server-full-20260908-200732.tgz}"
    KIT_SHA256="${KIT_SHA256:-ce243c87814d3970ed92e9582667f7945e548a5cb4e8f0373f6ab4d84ab64d62}"
    ;;
  source|modernize|sale)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/2d09f831b5ea8c19103c336fda9741ff/youngportal-sale-source-20260908-134736.tgz}"
    KIT_SHA256="${KIT_SHA256:-88823cf1891b080572324ed90b090b8c5134915b9ce3aae1bfd80da82e1b5dbc}"
    ;;
  portable|dev-portable)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/59e8202010547caced36e3890fd60346/youngportal-portable-dev-20260908-134736.tgz}"
    KIT_SHA256="${KIT_SHA256:-bd1bf4e404e519a9dec6d2c5c1decfc6022fd4dbcc1c1146f9cfa41b406c94ce}"
    ;;
  developer|reference|full)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/72f8718f99f60c9366bae549d7f6486d/youngportal-full-backup-20260908-194634.tgz}"
    KIT_SHA256="${KIT_SHA256:-0d794fc5609eccf2d340e75865795871419671778b9d7321abf7c50ae14a1e1a}"
    ;;
  *)
    echo "KIT_PROFILE=client|org|runtime|server|sale|portable|source|developer" >&2
    exit 1
    ;;
esac

mkdir -p "$(dirname "$OUT")"
yp_kit_fetch "$OUT"
echo "OK: $OUT"
echo "Дальше:"
echo "  tar -xzf $OUT && cd youngportal-*-kit-* && sudo bash START.sh --help"
