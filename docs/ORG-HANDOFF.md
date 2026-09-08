# YoungPortal — развёртывание для организации и модернизация

Актуально на **2026-09-08**. Домены эталона: **py.idivles.ru** (прод), **ty.idivles.ru** (тест).  
VPS эталона: `root@77.110.125.241`. Прод после promote: **1.6.158**.

Этот документ — единая инструкция: что лежит в архивах, как поставить на VPS,
как защитить сервер, как работать с сайтом и как пересобрать под другую организацию.

---

## 1. Какие архивы нужны

| Архив | Для кого | Содержимое |
|-------|----------|------------|
| `youngportal-portable-dev-*.tgz` | Разработчик | Исходники + установщик, без live БД |
| `youngportal-org-runtime-kit-*.tgz` | Организация **без исходников** | Docker image tar + dump + uploads + compose, нет `src/` |
| `youngportal-org-kit-*.tgz` | Организация с исходниками | Код + снимок БД/uploads/образов |
| `youngportal-sale-source-*.tgz` | Продажа / модернизация | Чистый исходник, без uploads/БД/секретов |
| `youngportal-server-full-*.tgz` | Полный снимок **живого VPS** | Docker-образы web, `/app` с `node_modules`, дамп БД, uploads. Секреты `.env` **на VPS** в `/var/backups/sochi-portal/secrets/`; раскладка: `sudo bash scripts/place-server-secrets.sh` |

### Скачать актуальные (2026-09-08, 1.6.176)

После каждого завершённого запроса агент обновляет киты через `bash scripts/post-request-handoff.sh`.

| Назначение | Файл | SHA-256 | URL |
|------------|------|---------|-----|
| Portable / dev (~44 МБ) | `youngportal-portable-dev-20260908-134736.tgz` | `bd1bf4e404e519a9dec6d2c5c1decfc6022fd4dbcc1c1146f9cfa41b406c94ce` | https://py.idivles.ru/backups/59e8202010547caced36e3890fd60346/youngportal-portable-dev-20260908-134736.tgz |
| Org **runtime** без src (~595 МБ) | `youngportal-org-runtime-kit-20260908-134736.tgz` | `36d16b4947720362a2b212157c47e2a0360747b31f992f50c577cc6b9aa82fcc` | https://py.idivles.ru/backups/f897e77da076d7363a67ba67035ad4a3/youngportal-org-runtime-kit-20260908-134736.tgz |
| Org kit + исходники (~639 МБ) | `youngportal-org-kit-20260908-134736.tgz` | `707d8c530172fdfc301ff5f08d300b79195f277d5095150b72656657464f3060` | https://py.idivles.ru/backups/5583708ce4551ad7f13f10ae484a5130/youngportal-org-kit-20260908-134736.tgz |
| Sale source (~44 МБ) | `youngportal-sale-source-20260908-134736.tgz` | `88823cf1891b080572324ed90b090b8c5134915b9ce3aae1bfd80da82e1b5dbc` | https://py.idivles.ru/backups/2d09f831b5ea8c19103c336fda9741ff/youngportal-sale-source-20260908-134736.tgz |
| **Server-full (живой VPS, ~794 МБ)** | `youngportal-server-full-20260908-200732.tgz` | `ce243c87814d3970ed92e9582667f7945e548a5cb4e8f0373f6ab4d84ab64d62` | https://py.idivles.ru/backups/e8557e9d7dcbb9b7d968d28af3e43c8d/youngportal-server-full-20260908-200732.tgz |
| Full source backup (~44 МБ) | `youngportal-full-backup-20260908-194634.tgz` | `0d794fc5609eccf2d340e75865795871419671778b9d7321abf7c50ae14a1e1a` | https://py.idivles.ru/backups/72f8718f99f60c9366bae549d7f6486d/youngportal-full-backup-20260908-194634.tgz |

Стабильные алиасы (тоже публичные):

- Full latest: https://py.idivles.ru/backups/full-latest.tar.gz
- Live latest: https://py.idivles.ru/backups/live-latest.tar.gz

**Секреты `.env`:** в публичный `server-full` не входят. На эталонном VPS копии лежат только в `/var/backups/sochi-portal/secrets/` (права `700`). После распаковки кита на **этом же** сервере:

```bash
sudo bash /opt/sochi-portal/scripts/stash-server-secrets.sh   # обновить сейф
sudo bash /opt/sochi-portal/scripts/place-server-secrets.sh  # вернуть .env на места
sudo RESTART=1 bash /opt/sochi-portal/scripts/place-server-secrets.sh  # + пересоздать web
```

**Защита org-runtime:** в архиве нет дерева TypeScript/`src/`, нет `.git`, нет значений `.env`. Есть собранный Docker-образ — его можно разобрать; это не DRM. Персональные данные в `db.dump`/`uploads` — не раздавайте URL без контроля.

```bash
# Org runtime (без исходников)
curl -fL -o youngportal-org-runtime.tgz \
  'https://py.idivles.ru/backups/79726a08bc6e2cb8824d968721e2f148/youngportal-org-runtime-kit-20260908-001446.tgz'
echo 'f1e830faf05eb7f9b8f026b1fac08cebfd2191ac01429dde7694e817a0d9d242  youngportal-org-runtime.tgz' | sha256sum -c

KIT_PROFILE=server bash scripts/download-kit.sh
KIT_PROFILE=runtime bash scripts/download-kit.sh
KIT_PROFILE=sale bash scripts/download-kit.sh
KIT_PROFILE=portable bash scripts/download-kit.sh
KIT_PROFILE=org bash scripts/download-kit.sh
```

Собрать заново:

```bash
bash scripts/pack-dev-deploy-kit.sh --out-dir /opt/cursor/artifacts
KIT_PREFIX=youngportal-org-kit bash scripts/pack-dev-deploy-kit.sh --with-live --out-dir /opt/cursor/artifacts
bash scripts/pack-org-runtime-kit.sh --out-dir /opt/cursor/artifacts
```

Перед упаковкой с контентом: дедуп заявок

```bash
docker exec sochi-portal-web-1 node /app/scripts/dedupe-applications.mjs
```

---

## 2. Быстрая установка на новый VPS (организация)

Требования: **Debian 12+ / Ubuntu 22.04+**, root, **≥ 2 GB RAM** (лучше 4), **≥ 20 GB** диска, A-запись домена на IP.

```bash
# Runtime kit (без исходников)
tar -xzf youngportal-org-runtime-kit-*.tgz
cd youngportal-org-runtime-kit-*
sudo PROD_DOMAIN=portal.example.ru bash START.sh

# Kit с исходниками
tar -xzf youngportal-org-kit-*.tgz
cd youngportal-org-kit-*
sudo bash START.sh
```

В меню / флагах:

| Цель | Команда |
|------|---------|
| Прод + тест, данные из снимка | `sudo bash INSTALL.sh --full` |
| Прод + тест, пустая БД + демо-роли | `sudo bash INSTALL.sh --demo` |
| Прод + тест, совсем пусто | `sudo bash INSTALL.sh --clean` |
| Переустановка с нуля | `sudo bash INSTALL.sh --reinstall --full` |

Неинтерактивно с другого хоста:

```bash
cd youngportal-org-kit-*
bash install-remote.sh root@НОВЫЙ_IP --full \
  --prod-domain portal.example.ru \
  --staging-domain test.example.ru \
  --le-email ops@example.ru \
  --admin-email admin@example.ru \
  --admin-password 'StrongPass1!'
```

После установки:

- Прод: `https://portal.example.ru/api/health`
- Тест: `https://test.example.ru/api/health`
- Отчёт: `/etc/yp-portal/INSTALL-REPORT.txt`
- Админ / роли: `/etc/yp-portal/admin-credentials.txt`, `seed-accounts.txt`
- Техслужба **только у разработчика**: `/etc/yp-portal/tech-credentials.txt` (не в отчёте заказчику)
- Живой снимок на другой VPS: `docs/VPS-RESTORE-LIVE.md`

Каталоги на сервере:

| Путь | Назначение |
|------|------------|
| `/opt/sochi-portal` | Прод |
| `/opt/sochi-portal-staging` | Тест (dual) |
| `/etc/yp-portal/` | Учётные данные, INTEGRITY |
| `/var/backups/sochi-portal/` | Бэкапы |

---

## 3. Безопасность VPS (обязательный минимум)

Выполняется установщиком (`START` / `INSTALL`) и/или вручную.

### 3.1 SSH

- Только ключи: `PasswordAuthentication no`, `PermitRootLogin prohibit-password`
- Нестандартный порт (по желанию) + UFW allow
- fail2ban jail `sshd`

```bash
# Пример (после добавления своего ключа в authorized_keys!)
sed -i 's/^#\?PasswordAuthentication.*/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl reload ssh
```

### 3.2 Firewall (UFW)

```bash
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH    # или ваш порт
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

### 3.3 Nginx

- Шаблоны: `deploy/nginx-dual-site.conf.tpl`, `deploy/nginx-yp-limits.conf`
- Rate-limit зон (как на эталоне / `strict`)
- HSTS после проверки TLS
- Web только на `127.0.0.1:3000` / `:3001` — снаружи только nginx

### 3.4 fail2ban

- `deploy/fail2ban-yp-nginx.local` — nginx 4xx/лимиты
- sshd jail включён

### 3.5 Docker / приложение

- Не публиковать порты Postgres/Redis наружу
- Секреты только в `/opt/sochi-portal/.env` (права `600`)
- Ежедневный бэкап: cron → `/var/backups/sochi-portal/`
- Обновления ОС: `unattended-upgrades` (опционально в установщике)
- CA Минцифры для MAX API: `certs/russian_trusted_ca.pem` + `NODE_EXTRA_CA_CERTS` в entrypoint

### 3.6 После установки — чеклист

1. Сменить пароль ADMIN  
2. Включить 2FA у ADMIN  
3. Прописать ботов MAX/Telegram в Admin → Боты, зарегистрировать webhook  
4. Режим работы (Контакты и часы) — от него зависит тихая доставка уведомлений  
5. `curl -sS https://ДОМЕН/api/health` → `"ok":true,"db":true`  
6. Бэкап: `bash /opt/sochi-portal/scripts/full-backup.sh` (или cron)

Подробнее по старым инцидентам: `docs/VPS-OS-SETUP.md`, `docs/related/hardening-ops.md`, `docs/related/security-plan.md`.

---

## 4. Как работать с сайтом (операционка)

### Dual: тест → прод

1. Правки → git push  
2. Staging: `bash scripts/workflow-deploy-staging.sh` → проверка на **ty** / вашем тест-домене  
3. Smoke: `bash scripts/smoke-sites.sh --staging-only`  
4. Человек: «одобряю» / «кати на prod»  
5. Promote: `CONFIRM=PROMOTE_YOUNG APPROVE=YES bash scripts/manual-promote-to-young.sh`  
6. Smoke prod  

Документ: `docs/WORKFLOW.md`.

### Модули и боты

- Admin → Модули — kill-switch разделов  
- Admin → Боты — MAX/Telegram, получатели, webhook  
- Вне рабочих часов (режим организации) уведомления приходят **тихо** (без звука/web-push)

### Контент

- Новости, клубы, проекты, пространства, афиша (брони), документы — через админку  
- Загрузки: `/opt/sochi-portal/public/uploads` (в бэкапе)

---

## 5. Модернизация под другую организацию

Исходник: `youngportal-source-full-*.tgz` или `source/app.tgz` внутри kit.

### 5.1 Брендинг и контакты

1. Admin → Контакты и часы: название, адрес, телефон, режим работы  
2. Admin → Соцсети / внешний вид: логотип, цвета (если заданы в настройках)  
3. `SiteSettings.publicSiteUrl` / `NEXTAUTH_URL` = ваш домен  
4. Юр. блок: Admin → Legal (оператор, ИНН, ОГРН)

### 5.2 Код (если нужна глубокая кастомизация)

| Область | Где смотреть |
|---------|--------------|
| Карта кода | `docs/CODEBASE-MAP.md`, `ARCHITECTURE.md` |
| Схема БД | `prisma/schema.prisma` |
| Деплой Docker | `docker-compose.yml`, `Dockerfile` |
| Nginx | `deploy/*.tpl` |
| Сиды контента | `scripts/seed-*.mjs` |
| Клиентский harden | `scripts/client-harden.sh` |

Чистая установка без чужих пользователей:

```bash
sudo bash INSTALL.sh --clean
# или --demo для тестовых ролей
```

Затем наполнить контент вручную или `node scripts/seed-crm-content.mjs` (осторожно — под ваш сценарий).

### 5.3 Лицензия и защита кода

- `LICENSE` в корне  
- Клиентский профиль снимает `docs/tests` и ставит src read-only: `scripts/client-harden.sh`  
- `docs/CODE-PROTECTION.txt`

---

## 6. Проверка скриптов kit

```bash
bash scripts/verify-kit-scripts.sh
bash scripts/qa-install-ha-scripts.sh   # если HA/replica
```

Smoke после деплоя:

```bash
bash scripts/smoke-sites.sh
bash scripts/smoke-sites.sh --staging-only
```

---

## 7. Контакты эталона (для справки)

| Роль | URL |
|------|-----|
| Прод | https://py.idivles.ru |
| Тест | https://ty.idivles.ru |
| Health | `/api/health` |
| Админ ботов | `/admin/bots` |

Не использовать устаревшие `young.idivles.ru` / `y1.idivles.ru` / `176.124.204.53` как умолчания.
