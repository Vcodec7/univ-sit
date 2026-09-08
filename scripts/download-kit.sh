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
# Разработчик (полный эталон):
#   KIT_PROFILE=developer bash scripts/download-kit.sh
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
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/a5b5dc55c4d507fd31578e96f79aa537/youngportal-org-kit-20260908-001446.tgz}"
    KIT_SHA256="${KIT_SHA256:-b820a9bb9b934b6ea4959bb2c2e05710b71d1784922a0d60611cd09a6d83a780}"
    ;;
  runtime|org-runtime|nosource)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/79726a08bc6e2cb8824d968721e2f148/youngportal-org-runtime-kit-20260908-001446.tgz}"
    KIT_SHA256="${KIT_SHA256:-f1e830faf05eb7f9b8f026b1fac08cebfd2191ac01429dde7694e817a0d9d242}"
    ;;
  source|modernize|sale)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/a17e0c717cfcfc372933fb0f8c89636a/youngportal-sale-source-20260908-001446.tgz}"
    KIT_SHA256="${KIT_SHA256:-e5115d9d974059b4df9055589eff5b93d2ad578ed4a9990646842e9948db8463}"
    ;;
  portable|dev-portable)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/90d0c734e518435ae14d7d25d8b6c45d/youngportal-portable-dev-20260908-001446.tgz}"
    KIT_SHA256="${KIT_SHA256:-2cf5bd0d45ab63647037b1ffe2bba1e0cae1583ed172417ac679707d672c4c4a}"
    ;;
  developer|reference|full)
    KIT_URL="${KIT_URL:-https://py.idivles.ru/backups/a17e0c717cfcfc372933fb0f8c89636a/youngportal-sale-source-20260908-001446.tgz}"
    KIT_SHA256="${KIT_SHA256:-e5115d9d974059b4df9055589eff5b93d2ad578ed4a9990646842e9948db8463}"
    ;;
  *)
    echo "KIT_PROFILE=client|org|runtime|sale|portable|source|developer" >&2
    exit 1
    ;;
esac

mkdir -p "$(dirname "$OUT")"
yp_kit_fetch "$OUT"
echo "OK: $OUT"
echo "Дальше:"
echo "  tar -xzf $OUT && cd youngportal-*-kit-* && sudo bash START.sh --help"
