---
name: youngportal-ui
description: Visual/UX work on YoungPortal from screenshots — contrast, header, hero, profile, booking flow, games chrome, quick access. Use for layout, CSS, mobile, hover, readability.
---

# YoungPortal UI — короткий цикл

Читай скилл **сразу**, если пользователь прислал скрины или пишет про полоску, пустое место, «не видно», профиль, бронь, V, футер, игры.

## Не делать заново

- Жест V по всей странице. Доступ = `.qa-edge-tab` + `attachEdgeSwipe` (край справа).
- Катить py без «одобряю».
- Полноэкранный иммерсив на `/games` (хаб). Иммерсив только `/games/<игра>`.
- **Не красить скролл `html`/`body` через `::-webkit-scrollbar { width }`.** Это превращает overlay-скролл в колонку (часто фиолетовую) справа от шапки и **прыжок при обновлении**. Цвет скролла — только у внутренних рельс (`.home-rail`), не у документа.
- **Не вешать `display:none` / unmount неба на `max-width`.** Сужение окна на десктопе не должно снимать луну/солнце. Lite только `pointer: coarse`, `prefers-reduced-motion`, save-data.
- **Иконки шапки — к правому краю бара** (`margin-left: auto`, без `min-width` колодца и без запасного gutter от кастомного скролла). Не сдвигать их внутрь «для красоты».
- На телефоне колода сценариев (кружки зал/коворкинг) **под фото**, не поверх моря. Stage героя `position: relative`, не `absolute` на весь section.

## Чеклист по скрину (пройти и закрыть пункты)

1. Кнопки: в ряд, если текст выше уже влезает; иначе две строки, не уже колонки.
2. Полоска: `border-bottom` / `box-shadow` у `.glass-nav`; шов герой↔шапка; бар камеры на аватаре.
3. Hover: карточки, пилюли, футер — смена фона/бордера, не «тишина».
4. Навигация: «назад» возвращает туда, откуда пришли (каталог `?from=list`), не на другой макет.
5. Профиль: аватар-кольцо; пропуск / репутация / М-баллы иконками; витрина-полка; история за иконкой.
6. Контраст: не фиолетовый текст на бледно-фиолетовом; не светло-серый на сером. CTA брони — `#fff` на `#6e4bc4`.
7. Ширина: один `--yp-shell` для колоды, «Это Сочи» и ленты. Герой-фото на всю ширину. Не оставлять тёмные (#0a0c2a / #06344a) подложки под карточками на публичной главной.
8. Хром: шапка + нижняя панель на публичных страницах и хабе игр.
9. CLS: высота `.glass-nav-inner` = `--nav-h`; не включать ширину системного скролла после first paint; не `useState(false)` на слоях героя, которые видны на десктопе.
10. Под `.home-section-title` — две короткие полоски лайм `#afca03` и фиолет `#8562d8`, не одна черта и не `display:none`.

## Файлы

- Герой: `HomeServiceHero.tsx`, `.svc-hero*` в `globals.css`, `sochi-living-sky.css`
- Каталог: `SpacesCatalogClient.tsx`, `BookBackLink.tsx`
- Профиль: `ProfileHeroCard.tsx`, `PersonalQrPanel.tsx`
- Доступ: `QuickAccess.tsx`, `src/lib/v-gesture.ts`
- Игры: `GamesShell.tsx`, `games.css` (`is-hub` / `is-play`)

## Проверка

```bash
npm run ui:guard
npm test
```

Визуал — после `bash scripts/apply-staging.sh` на https://ty.idivles.ru (Ctrl+F5).
