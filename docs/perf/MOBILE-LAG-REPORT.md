# Отчёт: где тормозит мобильная версия (ty, 1.6.141)

Дата: 2026-09-07. Проверка кода + HTTP, не лабораторный GPU-профайлер на устройстве.

## Где было тяжело

1. **TTFB главной.** Каталог уже в `unstable_cache`. Полный ISR (`revalidate = 60`) на ty отдавал HTML без canonical/og:url, потому что bake идёт без БД и Host. Главная снова `force-dynamic`, чтобы каноникал был `https://ty.idivles.ru`. Холод Prisma не каждый раз: cache каталога.

2. **Видео в герое.** `HomeHeroMedia` ставил `autoPlay` + `loop` при `heroMediaKind=video`. На телефоне это сеть + декодер + композитор на весь экран. Постер уже есть — ролик на coarse/узком вьюпорте не нужен.

3. **Living sky.** Слой `.sochi-sky`: CSS-mask, mix-blend swell, 12 звёзд, солнце/луна, интервал раз в минуту. Анимации swell на <900px уже выключались, но слой и mask оставались — лишний compositor pass поверх полноэкранного фото.

4. **Blur и циклы.** Часть `backdrop-filter` на шапке/стекле уже снималась в `layout-unify.css`. Оставались ghost-кнопки героя с blur и (если в разметке) `<video>`.

5. **Prefetch колоды.** Четыре ссылки колоды + CTA с `prefetch` тянули соседние маршруты сразу после героя.

## Что сделано

| Место | Было | Стало |
| --- | --- | --- |
| Главная | ISR 60 с без каноникала | `force-dynamic` + cache каталога |
| Герой-видео | autoplay сразу | только если не телефон/touch/save-data/reduced-motion; иначе постер |
| SochiLivingSky | всегда в DOM | `return null` на lite; CSS `display:none` на ≤900px / coarse |
| Кнопки героя | blur | без backdrop-filter на coarse |
| Колода | prefetch | `prefetch={false}` |

Версия на ty: **1.6.141**. Канонический URL не localhost.

## Как проверить на ty

1. Телефон или DevTools device, **Ctrl+F5** на `https://ty.idivles.ru`.
2. Главная: фото героя без крутящегося видео; нет «живого неба» поверх моря.
3. Скролл ленты без липкого блюра шапки.
4. Повторный заход: каталог из cache, HTML с `canonical` = `https://ty.idivles.ru`.
5. Десктоп широкий: living sky и видео (если в админке выбран video) остаются.

Прод `py.idivles.ru` не трогали.
