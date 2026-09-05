---
name: youngportal-ops
description: Work on YoungPortal (ty/py.idivles.ru) from this Cloud Agent. SSH, staging deploy, live brand CSS, stats, hero.
---

# YoungPortal — как работать здесь

## Домены и SSH

- Тест: `https://ty.idivles.ru` → `/opt/sochi-portal-staging` → Docker `sochi-staging-web-1` `:3001`
- Прод: `https://py.idivles.ru` → `/opt/sochi-portal` → `:3000`
- SSH: `cursor-site@77.110.125.241` ключ `~/.ssh/id_ed25519_cursor_site`, sudo без пароля
- **Не катить на py** без явного «одобряю»

## Живые правки без полной пересборки Next на VPS

Один вход:

```bash
bash scripts/apply-staging.sh          # код → prebuilt на ty
bash scripts/apply-staging.sh static   # только public/brand
```

Nginx отдаёт `/brand/` с диска staging: `/opt/sochi-portal-staging/public/brand/theme.css`

Не запускать `docker compose ... --build` на VPS — там OOM. Прод (py) не трогать без «одобряю».

## Фирменные цвета

Фиолетовый `#6A42C2`, лайм `#C1D92E`. Токены: `--primary`, `--accent` в `src/app/globals.css` и override в `public/brand/theme.css`.

## Герой главной

Режим «Видео (+ постер)» обязан показывать **постер**, если ролик не грузится. Не оставлять пустой `<video>` без `poster`.

## Статистика

«Уникальный гость» = разные `userId` в `TicketCheckIn` за период (проходы QR/вручную). Это не уникальные посетители сайта. Возраст: `ageLabelRu` — если `birthDate` пустая, писать «возраст не указан».

## Секреты

Не коммитить `.env`, не печатать пароли БД/Redis/NextAuth из `docker inspect`.
