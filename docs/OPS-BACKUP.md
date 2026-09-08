# Резервное копирование YoungPortal

## Дамп PostgreSQL

Да, **ежедневно**: cron `15 3 * * *` → `scripts/full-backup.sh` (`/etc/cron.d/yp-full-backup` при установке).

Скрипт пишет:

- `pg_dump -Fc` → `/var/backups/sochi-portal/db-*.dump`
- архив кода (без node_modules/.next/data postgres) → `full-*.tar.gz`

Локально на диске VPS хранятся ~14 дампов и ~7 полных архивов. Это **оперативный** слой, не единственная копия.

## Где должны лежать копии

Правильный ответ: **на другом носителе**, не только на том же SSD, что и сайт.

После локального дампа `full-backup.sh` вызывает `scripts/backup-offsite.sh`:

1. Поставить `rclone` и remote на S3-совместимое хранилище (Yandex Object Storage, Selectel, AWS S3).
2. Файл `/etc/yp-portal/backup.env`:

```bash
BACKUP_RCLONE_REMOTE=yp-s3:youngportal-backups
```

Без remote скрипт пишет `skip offsite` и не падает — локальный дамп всё равно есть. Пока remote не настроен, копии **не** считаются устойчивыми к потере VPS.

Публичные kit-ссылки (`publish-public-backup.sh`) — отдельный канал выдачи архива по токену, не замена off-box S3.

## Проверка восстановления

Бэкап бесполезен, пока его не разворачивали.

```bash
bash scripts/restore-db-drill.sh /var/backups/sochi-portal/db-XXXX.dump
```

Поднимает временный контейнер Postgres 16, `pg_restore`, считает строки `"User"`, контейнер удаляет.

Рекомендуемый ритм: **раз в месяц** на staging (не на py) плюс после смены версии Postgres.

Цель: убедиться, что из дампа сайт можно поднять за десятки минут (restore БД + `install-full-clone` / org-kit), а не узнать об этом в инцидент.
