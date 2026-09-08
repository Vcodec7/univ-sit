---
name: youngportal-ui
description: Visual/UX work on YoungPortal from screenshots — contrast, header, hero, profile, booking flow, games chrome, quick access. Use for layout, CSS, mobile, hover, readability.
---

# YoungPortal UI — короткий цикл

Читай скилл **сразу**, если пользователь прислал скрины или пишет про полоску, пустое место, «не видно», профиль, бронь, V, футер, игры.

Тексты в интерфейсе — **по-русски** (не сырые PENDING/APPROVED). Валюта — **М-баллы**.

## Не делать заново

- Жест V по всей странице. Доступ = `.qa-edge-tab` + `attachEdgeSwipe` (край справа).
- Катить py без «одобряю».
- Полноэкранный иммерсив на `/games` (хаб). Иммерсив только `/games/<игра>`.
- **Не красить скролл `html`/`body` через `::-webkit-scrollbar { width }`.** Overlay превращается в колонку справа от шапки и прыгает при refresh. Цвет — только у внутренних рельс (`.home-rail`).
- **Не unmount / `display:none` неба (`SochiLivingSky`) на `pointer:coarse` или узком `max-width`.** Луна пропадает, CLS после гидрации. Lite = CSS: выключить swell/звёзды, небо оставить.
- **Мобилка: прятать `.lift-deck`** при `max-width: 860px` (четыре иконки между героем и «Сейчас свободно»). На десктопе колоду оставить.
- **Высота героя:** `--yp-hero-h` на мобилке **вычитает док** (`env(safe-area)` / clamp), иначе refresh прыгает. Луна: clamp Y, не уезжает за край.
- **Главная / события:** не возвращать `WeeklyAfisha` / VK «афиша недели». Только `UpcomingEvents`, заголовок **Афиша**.
- **Документы:** шаблоны = категория «Шаблоны», DOCX через `/api/documents/templates/[id]`. Не превью-карточки шаблонов на главной. В официальном каталоге — только PDF. `/documents/verify` — свёрстанная форма, не сырой dump.
- **Поиск:** никогда нулевой `padding-left` у `.filter-bar__input` / `.space-filter-bar__input` (иконка наезжает на текст). Last-win в `layout-unify.css`.
- **Луна:** inset blur-сфера, не `inset -14px … 0 0` (ребро «монеты»).
- **Иконки шапки — к правому краю бара** (`margin-left: auto`, без `min-width` колодца и без gutter от кастомного скролла).
- **Не растягивать слайды ленты в равную высоту.** `min-height: 100%` + `margin-top: auto` у кнопок = пустые колодцы.
- **Заголовки каталога** — `overflow-wrap: break-word`, не `anywhere`. Бейдж «N площадок» не в одной узкой строке с h1.

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
10. Заголовки секций на главной — тёмные, **без** двухцветных полосок лайм/фиолет. Лайм только на CTA.
11. Лента: карточки по высоте контента. Не `min-height: 100%` на слайде + `margin-top: auto` у «Читать»/CTA.

## Файлы

- Герой: `HomeServiceHero.tsx`, `.svc-hero*` в `globals.css`, `sochi-living-sky.css`
- Каталог: `SpacesCatalogClient.tsx`, `BookBackLink.tsx`
- Профиль: `ProfileHeroCard.tsx`, `PersonalQrPanel.tsx`
- Доступ: `QuickAccess.tsx`, `src/lib/v-gesture.ts`
- Игры: `GamesShell.tsx`, `games.css` (`is-hub` / `is-play`)
- Поиск/паддинги: `layout-unify.css`

## Проверка

```bash
npm run ui:guard
npm test
```

Визуал — после `bash scripts/apply-staging.sh` на https://ty.idivles.ru (Ctrl+F5).
