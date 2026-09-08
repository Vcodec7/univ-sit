---
name: youngportal-ops
description: YoungPortal (ty/py.idivles.ru) — SSH, staging, бренд, деплой, дымовые проверки. Use for deploy, VPS, ty/py, apply-staging, smoke, secrets.
---

# YoungPortal — как работать здесь

## Цикл (меньше трудозатрат)

1. Правки кода пакетом, не по файлу с пушем.
2. Код: `npm test && npm run ui:guard`. Только скиллы/доки — тесты не обязательны.
3. Commit + push + PR (ветка `cursor/home-feed-unify-a6b1`, PR #8 — не плодить параллельные PR без нужды).
4. На ty: `bash scripts/apply-staging.sh prebuilt` (или `npm run ty`). Скиллы-only — деплой не обязателен.
5. `bash scripts/smoke-sites.sh --staging-only`
6. Прод только после «одобряю»: `CONFIRM=PROMOTE_YOUNG APPROVE=YES bash scripts/manual-promote-to-young.sh`
7. После кода (не полный org-kit): `SKIP_ORG_LIVE=1 SKIP_PUBLISH=1 bash scripts/post-request-handoff.sh`

Не запускать `docker compose ... --build` на VPS (OOM). Только CSS бренда: `bash scripts/apply-staging.sh static`.

Версию приложения бампать **только при смене app-кода**. Скиллы-only — без bump (или одна строка changelog).

## Домены и SSH

- Тест: `https://ty.idivles.ru` → `/opt/sochi-portal-staging` → `:3001`
- Прод: `https://py.idivles.ru` → `/opt/sochi-portal` → `:3000`
- SSH: `cursor-site@77.110.125.241`, ключ `~/.ssh/id_ed25519_cursor_site` (локально может быть `id_ed25519_yp`)
- **Не катить на py** без явного «одобряю»
- Staging после последнего деплоя: **1.6.181** на ty (не путать с py)

## Не делать заново (ops)

- **X-Frame-Options:** Next **без** этого заголовка; только nginx `DENY`. Не дублировать Next+nginx (конфликт). `apply-staging` / prebuilt патчит live nginx `SAMEORIGIN` → `DENY`.
- **PWA:** `/sw.js` + rewrite `/service-worker.js` → `/sw.js`. Precache **не** включать `/offline-games/` (directory URL → 308). `cache.add` — per-file `catch`, не валить весь SW.
- **Метрика:** idle-load; без clickmap / `accurateTrackBounce`. Виджеты госорганов на главной — **ссылки**, не iframe.
- **QA на ty:** `qa-admin@sochi.ru`, `mod@`, `part@`, `user@`, `scanner@`, `private@`, **`tech@sochi.ru`** (TECH → `/ops`). Пароль **не писать в скилл** — из `scripts/reset-staging-qa-passwords` / `apply-staging`. Не коммитить `.env`.

## Скрипты

| Команда | Зачем |
| --- | --- |
| `npm run ty` | `apply-staging.sh` |
| `npm run smoke:ty` | HTTP smoke только ty |
| `npm run ui:guard` | регрессии CSS/контраста |
| `npm test` | `tests/*.test.mjs` |
| `bash scripts/apply-staging.sh prebuilt` | Next собирается здесь, на VPS только маленькая Docker-сборка |
| `YP_REUSE_NEXT=1 bash scripts/apply-staging.sh prebuilt` | Повторная выкладка того же `.next` (только если сборка уже есть и код не менялся) |
| `bash scripts/dev-loop.sh` | test + ui-guard одной командой |

## Фирменные цвета

Лаванда `#8562D8`, лайм `#AFCA03`, чернила `#0A0C2A`. CTA лайм + тёмный текст; бронь — белый на фиолетовом.

## Герой главной

Режим «Видео (+ постер)» обязан показывать **постер**, если ролик не грузится.

## Секреты

Не коммитить `.env`, не печатать пароли БД/Redis/NextAuth из `docker inspect`. Не коммитить `docs/perf/qa-ty-roles-*.json` и `homepage-layout-v1.6.90.webp`.
