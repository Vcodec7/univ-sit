---
name: youngportal-ops
description: YoungPortal (ty/py.idivles.ru) — SSH, staging, бренд, деплой, дымовые проверки. Use for deploy, VPS, ty/py, apply-staging, smoke, secrets.
---

# YoungPortal — ops

## Цикл

1. Правки пакетом → commit + push. PR: **ManagePullRequest** (`create_pr`). `gh` только read-only — **не** `gh pr create`.
2. Код: `npm test && npm run ui:guard` (или `npm run dev:loop`). Только md/skills — тесты не обязательны; `ui:guard` если линтит md.
3. ty: `bash scripts/apply-staging.sh` / `prebuilt` / `static` / `sync` (`npm run ty`). Docs/scripts без образа: `sync`. Не `docker compose --build` на VPS.
4. `bash scripts/smoke-sites.sh --staging-only`
5. Прод **только** после «одобряю»: `CONFIRM=PROMOTE_YOUNG APPROVE=YES bash scripts/manual-promote-to-young.sh`
6. Handoff: `bash scripts/post-request-handoff.sh`. Мелкие/док: `SKIP_ORG_LIVE=1 SKIP_PUBLISH=1`.

Версию бампать только при смене runnable-кода/скриптов.

## Домены и SSH

- Тест: `https://ty.idivles.ru` → `/opt/sochi-portal-staging` → `:3001`
- Прод: `https://py.idivles.ru` → `/opt/sochi-portal` → `:3000`
- VPS `77.110.125.241:22`. Default `scripts/lib/vps.sh`: `cursor-site@…` (ключи `id_ed25519_cursor_site` или `id_ed25519_yp`). Также `root@`. Не young/y1 / `176.124.204.53`.
- **Не катить py** без «одобряю».

## Health / версия

Публичный `GET /api/health` через HTTPS (nginx + `X-Forwarded-Proto: https`) — `{ok, maintenanceMode}` после hardening (`src/lib/health-access.ts` на `cursor/ty-tz-hardening-a6b1`; на этой ветке route ещё полный JSON). **Версию** смотреть loopback `http://127.0.0.1:3001/api/health` **без** `X-Forwarded-Proto: https`. Деплой проверяет loopback.

## QA на ty (не в маркетинговые доки)

`qa-admin@sochi.ru`, `mod@`, `part@`, `user@`, `scanner@`, `private@`, `tech@sochi.ru` (TECH → `/ops`). Пароль **`RolePass123!`**. Сброс: `scripts/reset-staging-qa-passwords.mjs`. Не коммитить `.env`, `docs/perf/qa-ty-roles-*.json`, `homepage-layout*.webp`.

## Не делать заново

- X-Frame-Options: Next без заголовка; nginx `DENY`.
- PWA: `/sw.js`; не precache `/offline-games/`; SW **не** catch-all fetch.
- SMS: Admin → Настройки → SMS. OTP на логине только `smsLoginEnabled && smsLoginReady`.
- Капча: плитки **PNG**, не emoji.
- OG: `publicAssetUrl` / публичный origin, **не localhost**; пейзаж `/covers/photo/sochi-sea.jpg` (на ty-hardening; здесь OG ещё icon-512 — не регрессировать на localhost).

## Скрипты

| Команда | Зачем |
| --- | --- |
| `apply-staging.sh` | auto: src→prebuilt, brand→static |
| `… prebuilt` / `YP_REUSE_NEXT=1` | Next здесь; reuse `.next` |
| `… static` / `… sync` | бренд / rsync без rebuild |
| `npm run smoke:ty` / `ui:guard` / `test` | HTTP ty / CSS / unit |

Цвета: `#8562D8` / `#AFCA03` / `#0A0C2A`. CTA брони — белый на фиолетовом.
