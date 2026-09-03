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

## Живые правки без полной пересборки

Nginx отдаёт `/brand/` с диска staging:

```
/opt/sochi-portal-staging/public/brand/theme.css
```

Цвета и мелкий CSS — править `public/brand/theme.css` в git, затем:

```bash
scp -i ~/.ssh/id_ed25519_cursor_site public/brand/theme.css \
  cursor-site@77.110.125.241:/tmp/theme.css
ssh … 'sudo cp /tmp/theme.css /opt/sochi-portal-staging/public/brand/theme.css'
```

Страница подхватывает файл сразу (Ctrl+F5). Код React/API — нужен `docker compose -p sochi-staging -f docker-compose.staging.yml up -d --build` из `/opt/sochi-portal-staging`. Перед сборкой смотреть `df -h` (диск ~30G).

## Фирменные цвета

Фиолетовый `#6A42C2`, лайм `#C1D92E`. Токены: `--primary`, `--accent` в `src/app/globals.css` и override в `public/brand/theme.css`.

## Герой главной

Режим «Видео (+ постер)» обязан показывать **постер**, если ролик не грузится. Не оставлять пустой `<video>` без `poster`.

## Статистика

«Уникальный гость» = разные `userId` в `TicketCheckIn` за период (проходы QR/вручную). Это не уникальные посетители сайта. Возраст: `ageLabelRu` — если `birthDate` пустая, писать «возраст не указан».

## Секреты

Не коммитить `.env`, не печатать пароли БД/Redis/NextAuth из `docker inspect`.
