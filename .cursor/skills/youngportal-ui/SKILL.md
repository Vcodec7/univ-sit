---
name: youngportal-ui
description: Visual/UX work on YoungPortal from screenshots — contrast, header, hero, profile, booking flow, games chrome, quick access. Use for layout, CSS, mobile, hover, readability.
---

# YoungPortal UI

Тексты — **по-русски**. Валюта — **М-баллы**.

## Не делать заново

- Жест V на всю страницу. Доступ: `.qa-edge-tab` + свайп с правого края.
- Катить py без «одобряю». Иммерсив только `/games/<id>`, не хаб `/games`.
- Не `::-webkit-scrollbar { width }` и не `scrollbar-gutter` на `html`.
- **Не unmount `SochiLivingSky`** на `pointer:coarse`. Lite = CSS, небо смонтировано.
- Мобилка: прятать `.lift-deck` при `max-width: 860px`. `--yp-hero-h` вычитает док.
- Не возвращать `WeeklyAfisha`. Только `UpcomingEvents`, заголовок **Афиша**.
- Документы: категория «Шаблоны»; verify — форма. Поиск: padding-left у input.
- Лента: не `min-height: 100%` + `margin-top: auto`. Капча PNG. OG не localhost.

## Кабинет

**Эта ветка:** сайдбар с Настройками, отдельные Друзья/Сообщения/Билеты/Заявки (`src/lib/cabinet-nav.ts`).

**Целевой UX на ty** (ветка `cursor/cabinet-nav-compact-a6b1`, код сюда не копировать как уже слитый): без Настроек в сайдбаре (меню аватара); **Общение** / **Билеты и заявки** / **Ещё** / **Мои достижения**.

## Чеклист

Контраст CTA `#fff` на `#6e4bc4`; hover; `?from=list`; BOTH; хром на хабе игр; две полоски под `.home-section-title`; один `--yp-shell`.

Файлы: `HomeServiceHero.tsx`, `sochi-living-sky.css`, `SpacesCatalogClient.tsx`, `ProfileHeroCard.tsx`, `QuickAccess.tsx`, `v-gesture.ts`, `GamesShell.tsx`, `layout-unify.css`, `cabinet-nav.ts`.

`npm run ui:guard && npm test`. Визуал: ty после apply-staging (Ctrl+F5).
