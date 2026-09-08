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
| `youngportal-full-backup-*.tgz` / `full-*.tar.gz` | DR | Полный архив кода (локальный) / хоста VPS |

### Скачать актуальные (2026-09-08, после promote 1.6.158)

После каждого завершённого запроса агент обновляет киты через `bash scripts/post-request-handoff.sh`.

| Назначение | Файл | SHA-256 | URL |
|------------|------|---------|-----|
| Portable / dev (~44 МБ) | `youngportal-portable-dev-20260908-001446.tgz` | `2cf5bd0d45ab63647037b1ffe2bba1e0cae1583ed172417ac679707d672c4c4a` | https://py.idivles.ru/backups/90d0c734e518435ae14d7d25d8b6c45d/youngportal-portable-dev-20260908-001446.tgz |
| Org **runtime** без src (~593 МБ) | `youngportal-org-runtime-kit-20260908-001446.tgz` | `f1e830faf05eb7f9b8f026b1fac08cebfd2191ac01429dde7694e817a0d9d242` | https://py.idivles.ru/backups/79726a08bc6e2cb8824d968721e2f148/youngportal-org-runtime-kit-20260908-001446.tgz |
| Org kit + исходники (~636 МБ) | `youngportal-org-kit-20260908-001446.tgz` | `b820a9bb9b934b6ea4959bb2c2e05710b71d1784922a0d60611cd09a6d83a780` | https://py.idivles.ru/backups/a5b5dc55c4d507fd31578e96f79aa537/youngportal-org-kit-20260908-001446.tgz |
| Sale source (~44 МБ) | `youngportal-sale-source-20260908-001446.tgz` | `e5115d9d974059b4df9055589eff5b93d2ad578ed4a9990646842e9948db8463` | https://py.idivles.ru/backups/a17e0c717cfcfc372933fb0f8c89636a/youngportal-sale-source-20260908-001446.tgz |
| Full source backup (~44 МБ) | `youngportal-full-backup-20260908-001446.tgz` | `1388b5caf5ec3e55befb55ec61f545b3bccdbb9c0168da822b640d98b3f606a0` | https://py.idivles.ru/backups/f3c8bbc4c37e6359d362bdfd1bc2e587/youngportal-full-backup-20260908-001446.tgz |
| VPS host full | `full-2026-09-08_001151.tar.gz` | `18411ecc7d84c6ffda717120b696457b644b074aa75a7d1a26705c8a05282682` | https://py.idivles.ru/backups/9e987bf763a1d529cdead7059d535317/full-2026-09-08_001151.tar.gz |
| Live snapshot DR (~732 МБ) | `live-2026-09-08_001003.tar.gz` | `6542d0dfbdd9e17fea5b32b150521c4e1766dd6a17716a7e023906b51e95f187` | https://py.idivles.ru/backups/79693c545db598dabecb43f1a5d5537e/live-2026-09-08_001003.tar.gz |

Стабильные алиасы (тоже публичные):

- Full latest: https://py.idivles.ru/backups/full-latest.tar.gz
- Live latest: https://py.idivles.ru/backups/live-latest.tar.gz

**Защита org-runtime:** в архиве нет дерева TypeScript/`src/`, нет `.git`, нет значений `.env`. Есть собранный Docker-образ — его можно разобрать; это не DRM. Персональные данные в `db.dump`/`uploads` — не раздавайте URL без контроля.

```bash
# Org runtime (без исходников)
curl -fL -o youngportal-org-runtime.tgz \
  'https://py.idivles.ru/backups/79726a08bc6e2cb8824d968721e2f148/youngportal-org-runtime-kit-20260908-001446.tgz'
echo 'f1e830faf05eb7f9b8f026b1fac08cebfd2191ac01429dde7694e817a0d9d242  youngportal-org-runtime.tgz' | sha256sum -c

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
