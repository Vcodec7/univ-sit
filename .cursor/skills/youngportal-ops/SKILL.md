---
name: youngportal-ops
description: YoungPortal (ty/py.idivles.ru) — SSH, staging, бренд, деплой, дымовые проверки. Use for deploy, VPS, ty/py, apply-staging, smoke, secrets.
---

# YoungPortal — как работать здесь

## Цикл (меньше трудозатрат)

1. Правки кода пакетом, не по файлу с пушем.
2. `npm test && npm run ui:guard`
3. Commit + push + PR.
4. На ty: `bash scripts/apply-staging.sh` (или `npm run ty`).
5. `bash scripts/smoke-sites.sh --staging-only`
6. Прод только после «одобряю»: `CONFIRM=PROMOTE_YOUNG APPROVE=YES bash scripts/manual-promote-to-young.sh`

Не запускать `docker compose ... --build` на VPS (OOM). Только CSS бренда: `bash scripts/apply-staging.sh static`.

## Домены и SSH

- Тест: `https://ty.idivles.ru` → `/opt/sochi-portal-staging` → `:3001`
- Прод: `https://py.idivles.ru` → `/opt/sochi-portal` → `:3000`
- SSH: `cursor-site@77.110.125.241`, ключ `~/.ssh/id_ed25519_cursor_site` (локально может быть `id_ed25519_yp`)
- **Не катить на py** без явного «одобряю»

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

Не коммитить `.env`, не печатать пароли БД/Redis/NextAuth из `docker inspect`.
