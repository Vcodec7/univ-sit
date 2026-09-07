# Полный аудит портала — 5 сентября 2026 (перепроверка)

Метод: повторный разбор кода (админка, ACL, уведомления, модерация, заявки, брони, вакансии, конкурсы, публичные маршруты, модули) + правки удобства админа в той же сессии + `npm test` / `ui:guard`.  
Не метод: клик каждой роли на живом стенде (нет полного набора учёток и SMTP/ботов в этой среде). Ниже явно отделено **реализовано в коде** от **не проверено живьём**.

Версия кода на момент этого снимка: **1.6.63**.

Связанные гайды: `docs/admin/guide.md`, `docs/user/guide.md`, `docs/ORG-ADMIN-GUIDE.md`.

---

## 1. Вывод

Контур рабочего молодёжного портала: каталоги создаются и правятся в админке, очереди заявок и броней с уведомлениями, роли режут доступ, модули можно выключить. После этой перепроверки **вакансии и конкурсы тоже правятся из UI** (раньше API умел `id`, формы только создавали). Удаление каталогов — с `confirm`. Занятость залов: блок и снятие служебного слота; путь ACL `/admin/occupancy` открыт по праву `bookings` (раньше неизвестный путь считался только полным ADMIN — модератор афиши мог не попасть в раздел).

Остаётся вне «карточки каталога»: заменить файл документа, отозвать выданную награду, править карточку команды «О нас» без передобавления.

---

## 2. Админ: создание и правка

### 2.1 Создать + изменить + удалить

| Раздел | Путь | Создать | Изменить | Удалить | Подтверждение удаления |
|--------|------|---------|----------|---------|-------------------------|
| Проекты | `/admin/projects` | да (`?add=`) | да (`?edit=`) | да | да (с 1.6.63) |
| Клубы | `/admin/clubs` | да | да | да | да |
| Пространства | `/admin/spaces` | да | да | да | да · QR чекина отдельно |
| Куда сходить | `/admin/places` | да | да | да | да · отзывы: одобрить/отклонить |
| Гранты / Добро / Самоуправление | `/admin/programs` | да | да | да | да |
| CMS-страницы | `/admin/pages`, `/new`, `/[id]/edit` | да | да | да (не системные) | да |
| FAQ | `/admin/faq` | да | да | да | да |
| Новости | `/admin/news` | да | да | да | да |
| Документы | `/admin/documents` | загрузить | нет замены файла | да | да |
| Вакансии | `/admin/vacancies` | да | **да** (кнопка «Править», статус, оплата, стек, скрининг) | нет удаления в UI | — |
| Работодатели | там же | да | **да** | нет | — |
| Конкурсы | `/admin/contests` | да | **да** (название, статус, правила, приз, bookingId) | нет удаления в UI | — |
| Команда «О нас» | `/admin/about-team` | upsert | передобавить роль | да | смотреть форму |
| Награды | `/admin/awards` | выдать бланк | нет отзыва | нет | — |

Поля программ: kind, status, title, summary, HTML, organizer, place, amountLabel, seats, dates, bodyType, tags, cover, sortOrder.

Самоуправление: публичные блоки «чем заниматься / кому» идут по `bodyType`; описание в форме всё равно заполнять.

### 2.2 Очереди (не каталог)

| Раздел | Действия | Уведомление участнику |
|--------|----------|------------------------|
| `/admin/bookings` | одобрить / отклонить бронь (причина) | да + ICS при одобрении |
| `/admin/applications` | клубы, проекты, гранты, добро, самоупр. | да |
| `/admin/portfolios` | статус работы | да |
| `/admin/vacancies` отклики | одобрить / отклонить **с полем причины** | да (VACANCY) |
| `/admin/contests` работы | одобрить / отклонить **с причиной**; розыгрыш; топ-3; ручные М-баллы | да (CONTEST) |
| `/admin/pending-users` | заявки регистрации (полный ADMIN) | да при решении |
| `/admin/moderation` | флаги чата, предупреждения, бан | MODERATION / SECURITY |
| `/admin/occupancy` | служебный блок слота / **снять** | нет (операция зала) |

### 2.3 Система (полный ADMIN, не limited)

Пользователи и удаление с confirm, карточка пользователя (роль, права, блок, карма), заявки регистрации, настройки сайта, бэкап, РКН, боты, онлайн, журнал, состояние сервера, IP/подозрительные (право `moderation`).

Limited ADMIN: только permissions после токена `limited`.

---

## 3. Роли

| Роль | Кабинет | Админка | Сканер | Бронь / заявки / отклик |
|------|---------|---------|--------|-------------------------|
| Гость | нет | нет | нет | нет (каталоги частично открыты; вакансии обычно после входа) |
| USER / PARTICIPANT | да | нет | нет | да, если не pending/blocked. PARTICIPANT почти косметика |
| MODERATOR | да | выданные CSV-права | если `scanner` | да |
| ADMIN | да | всё | да | да |
| ADMIN limited | да | по permissions | по правам | да |
| SCANNER | нет | нет (occupancy API да) | да | **нельзя** |
| TECH | нет кабинета сайта | нет chrome `/admin` | да | **нельзя** как участник |

Права модератора: `projects`, `clubs`, `spaces`, `places`, `bookings`, `applications`, `pages`, `programs`, `news`, `stats`, `scanner`, `portfolios`, `moderation`, `vacancies`, `contests`.

Новый staff: `mustChangePassword` → `/change-password`.

Kill-switch модулей (TECH): выключенный модуль режет UI и API («раздел выключен» / `/unavailable`).

---

## 4. Публичные и кабинетные маршруты

### Гость / общий сайт

`/` главная · `/about` · `/projects` `/projects/[id]` · `/clubs` `/clubs/[id]` · `/spaces` `/spaces/[id]` `/spaces/[id]/book` · `/coworking` · `/places` `/places/[id]` · `/events` · `/news` `/news/[id]` · `/documents` `/documents/[id]` · `/faq` · `/grants` `/grants/[id]` · `/dobro` `/dobro/[id]` · `/self-gov` `/self-gov/[id]` · `/vacancies` `/vacancies/[id]` `/vacancies/employer` · `/contests` `/contests/[id]` · `/portfolio` `/portfolio/[id]` `/portfolio/verify` · `/awards/[id]` · `/gallery` · `/games` и игры (snake, tetris, memory, fifteen, checkers, breakout) · `/search` · `/contacts` · `/privacy` `/privacy/verify` · `/rules` · `/terms` · `/p/[slug]` CMS (в т.ч. медиа, правила дома) · `/u/[id]` публичный профиль · `/presentation` · `/maintenance` · `/unavailable`

### Участник

`/login` `/register` `/forgot-password` `/reset-password` `/verify` `/change-password` · `/dashboard` `/dashboard/edit` `/dashboard/settings` `/dashboard/applications` `/dashboard/portfolio` `/dashboard/awards` `/dashboard/achievements` `/dashboard/shop` `/dashboard/games` `/dashboard/guides` `/dashboard/referrals` `/dashboard/showcase` `/dashboard/notifications` · `/friends` · `/messages` · `/tickets` · `/check-in` · `/bind/max`

### Сотрудник

`/admin/*` (см. сайдбар) · `/scanner` `/scan` `/c/[token]` чекин площадки

---

## 5. Действия, подтверждения, уведомления

| Действие | Подтверждение / гейт | Участнику | Сотрудникам |
|----------|----------------------|-----------|-------------|
| Регистрация | email OTP; иначе очередь ADMIN | — | pending-users, SECURITY при мультиаккаунте |
| Модерация аккаунта | авто ~3 раб. часа МСК или админ | блок участия пока pending | очередь |
| 2FA | TOTP | — | — |
| Бронь | авто или PENDING | BOOKING_REQUEST, ICS | админка, почта, Telegram/MAX |
| Лист ожидания | продвижение | email + in-app | — |
| Заявка клуб/проект/программа | PENDING | APPLICATION | боты + админка |
| Приглашение в сущность | принять/отклонить | ENTITY_INVITE | — |
| Отклик вакансии | автоскрининг, капча гостю | VACANCY | очередь |
| Работа конкурса | модерация | CONTEST | очередь |
| Портфолио | модерация | PORTFOLIO | очередь |
| Друзья | — | FRIEND_REQUEST | — |
| Сообщения | цензор, флаг | MESSAGE | MODERATION при нарушениях |
| Чекин | QR | CHECK_IN | staff check-in |
| Награда / бланк | выдача админом | AWARD | — |
| М-баллы магазин / уровень | пороги | ECO, LEVEL | — |
| Блок аккаунта | причина на карточке | SECURITY | журнал |
| Сброс сессий / revoke | — | SECURITY | — |

Типы колокольчика: `MESSAGE`, `FRIEND_REQUEST`, `BOOKING_REQUEST`, `APPLICATION`, `ENTITY_INVITE`, `CHECK_IN`, `PORTFOLIO`, `MODERATION`, `SECURITY`, `ECO`, `CONTEST`, `VACANCY`, `AWARD`, `LEVEL`, `SYSTEM`.

Каналы: in-app, web-push (тихий час в prefs), почта броней/заявок, Telegram/MAX очередей. Модуль `notifications` гасит каналы.

---

## 6. Нарушения и авторитет

- Чат: маскирование, флаг, предупреждения, автоблок (порог по умолчанию 5).
- РКН-ссылки в чате: блоклист, алерт staff.
- Ручной блок: причина, история, разлогин.
- Антимультиаккаунт: IP/отпечаток при регистрации.
- Авторитет: явка / неявка (−10 / +4), гейты вакансий и конкурсов. Соцрейтинг отдельно.
- Карма на карточке пользователя.

---

## 7. Модули (выключатели)

`registration`, `messaging`, `events`, `tickets_scan`, `places`, `gallery`, `projects`, `clubs`, `spaces`, `grants`, `dobro`, `self_gov`, `vacancies`, `contests`, `friends`, `games`, `news`, `portfolio`, `eco`, `achievements`, `ratings`, `club_chat`, `applications`, `notifications`, `documents`, `referrals`, `faq`, `presentation`, `server_status`, `bots`, `maintenance`.

---

## 8. Что ещё не закрыто удобством

- Документ: нет «заменить файл» / править метаданные без удаления.
- Награды: нет отзыва бланка.
- Вакансия/конкурс: нет кнопки удалить (можно CLOSED/ARCHIVED).
- Occupancy: бронь пользователя снимается в афише, не кнопкой «Снять» (только SERVICE/CLOSED).
- JSON-поля проектов/клубов (roadmap, roles) легко сломать руками.
- Отказ вакансии: если поле пустое — запасной текст, не жёсткое «Не подходит».

---

## 9. Не кликали живьём

Сканер на телефоне, ESIA/Яндекс/VK, SMS, фактический SMTP/MAX/Telegram, розыгрыш на проде, скачивание бэкапа, конфликт двух броней в одну минуту, автоодобрение регистрации кроном, смена роли с mustChangePassword на стенде.

Приёмка: USER, MODERATOR с одним правом, ADMIN; бронь PENDING; заявка на парламент; отклик; правка вакансии; правка конкурса; блок и снятие слота; флаг в чате; выдача награды.

---

## 10. Тесты

`npm test` — репозиторные unit/static тесты (ACL-смысл частично, каталоги, вакансии, места, медиа, правила, самоуправление, аудит-навигация).  
`npm run ui:guard` — шапка.

Не замена ручного прогона ролей (`qa:roles`, `qa:matrix` в package.json).
