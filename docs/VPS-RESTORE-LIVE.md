# Развернуть живой снимок (БД + uploads + Docker-образы) на другом VPS

Это **не** «переезд ty». **py.idivles.ru** — эталон продакшена Сочи. Для заказчика собирается архив `youngportal-org-kit-*` или `youngportal-org-runtime-kit-*` со снимком **прода**.

## Что взять

| Архив | Когда |
|-------|--------|
| `youngportal-org-kit-*.tgz` | Есть исходники + `snapshot/db.dump` + `uploads.tgz` + `images.tar.gz` |
| `youngportal-org-runtime-kit-*.tgz` | Без `src/`, только образ + дамп + compose |

Зависимости (Node/Postgres/Redis) уже **внутри Docker-образов** в `snapshot/images.tar.gz`. На новом VPS **не** нужен `npm ci` с нуля, если грузите образы.

## Требования к новому серверу

Debian 12+ / Ubuntu 22.04+, root, ≥4 GB RAM (лучше), ≥40 GB диск под дамп+uploads+images, два домена (прод + тест) с A на IP.

## Установка

```bash
# с машины разработчика
KIT_PROFILE=org bash scripts/download-kit.sh /tmp/yp-org.tgz
tar -xzf /tmp/yp-org.tgz -C /tmp
cd /tmp/youngportal-org-kit-*

SSHPASS='пароль-root' bash install-remote.sh root@НОВЫЙ_IP --developer --full \
  --prod-domain portal.заказчик.ru \
  --staging-domain test.заказчик.ru \
  --le-email ops@заказчик.ru \
  --site-name 'Молодёжный портал Города' \
  --org-city 'Город' \
  --org-address 'улица, дом' \
  --contact-phone '+7…' \
  --contact-email info@заказчик.ru \
  --operator-name 'ООО …' \
  --operator-inn '…' \
  --operator-ogrn '…' \
  --pdn-email pdn@заказчик.ru
```

На самом VPS:

```bash
tar -xzf youngportal-org-kit-*.tgz
cd youngportal-org-kit-*
sudo bash START.sh --developer --full --yes \
  --prod-domain portal.заказчик.ru \
  --staging-domain test.заказчик.ru \
  --le-email ops@заказчик.ru \
  --site-name '…'
```

После установки:

- отчёт: `/etc/yp-portal/INSTALL-REPORT.txt`
- роли для проверки: `/etc/yp-portal/seed-accounts.txt` (если `--demo`, не `--full`)
- первый ADMIN: `/etc/yp-portal/admin-credentials.txt`
- техслужба **только разработчику**: `/etc/yp-portal/tech-credentials.txt` (не отдавать заказчику)
- проверка бренда: `/etc/yp-portal/branding-check.txt`

`--full` поднимает **контент Сочи** из снимка. Имя/домен/контакты из флагов перезапишут `SiteSettings`. Пользователи и новости останутся сочинскими, пока не почистите в админке.

Чистый портал заказчику без чужих ПДн: `--client` (пустая БД + один ADMIN), не `--full`.

Runtime без исходников: `sudo PROD_DOMAIN=… bash START.sh` из `youngportal-org-runtime-kit-*` (см. `docs/ORG-RUNTIME-KIT.txt`).
