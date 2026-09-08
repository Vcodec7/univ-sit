# QA: автопроверки и прогон ролей

## Быстрый запуск

```bash
# всё сразу (модули ON/OFF + deep roles + soft full/matrix)
npm run qa:all
# или
node scripts/qa-all.mjs https://ty.idivles.ru

# по частям
npm run qa:modules
npm run qa:roles
npm run qa:roles:full
npm run qa:matrix

# после изменений модулей — обновить презентацию и архив скачивания
npm run presentation:refresh
# или вместе с QA:
QA_REFRESH_PRESENTATION=1 npm run qa:all
```

Учётки QA на ty: `qa-admin@sochi.ru`, `mod@`, `part@`, `user@`, `scanner@`, `private@`, `tech@sochi.ru` (вход TECH: `/login?callbackUrl=/ops`). Пароль стенда — в `.cursor/skills/youngportal-ops/SKILL.md` / `scripts/reset-staging-qa-passwords.mjs`, не дублировать в публичных гайдах.  
Прод-TECH только `TECH_EMAIL` / `TECH_BOOTSTRAP_PASSWORD` в `.env`. Отчёты `docs/perf/qa-ty-roles-*.json` **не коммитить**.

## Что входит

| Скрипт | Назначение |
|--------|------------|
| `qa-all.mjs` | Оркестратор |
| `qa-modules-toggle.mjs` | Публичные URL vs kill-switch |
| `qa-deep-roles-ux.mjs` | Guest→TECH безопасность и сценарии |
| `qa-full-roles.mjs` / `qa-role-matrix.mjs` / `qa-ui-roles.mjs` | Расширенные матрицы (soft в `qa-all`) |

Отчёты: `docs/perf/qa-*.json`.

## Презентация и TECH

Модуль **`presentation`** в `/ops` (TECH): выключает `/presentation` и `/downloads/youngportal-presentation*`.

Автообновление слайдов под текущие флаги:

```bash
npm run presentation:refresh
```

Пишет `public/presentation/deck/status.json`, правит ON/OFF в HTML, пересобирает `.tgz`.  
После деплоя или смены флагов в Ops — запускайте refresh (вручную или cron на CI/VPS).
