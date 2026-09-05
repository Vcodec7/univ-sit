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

## Чеклист по скрину (пройти и закрыть пункты)

1. Кнопки: в ряд, если текст выше уже влезает; иначе две строки, не уже колонки.
2. Полоска: `border-bottom` / `box-shadow` у `.glass-nav`; шов герой↔шапка; бар камеры на аватаре.
3. Hover: карточки, пилюли, футер — смена фона/бордера, не «тишина».
4. Навигация: «назад» возвращает туда, откуда пришли (каталог `?from=list`), не на другой макет.
5. Профиль: аватар-кольцо; пропуск / репутация / М-баллы иконками; витрина-полка; история за иконкой.
6. Контраст: не фиолетовый текст на бледно-фиолетовом; не светло-серый на сером. CTA брони — `#fff` на `#6e4bc4`.
7. Ширина: `auto-fit` / `1fr`, не узкая колонка слева и пустота справа.
8. Хром: шапка + нижняя панель на публичных страницах и хабе игр.

## Файлы

- Герой: `HomeServiceHero.tsx`, `.svc-hero*` в `globals.css`
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
