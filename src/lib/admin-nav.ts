import type { ModeratorPermission } from '@/lib/acl-shared';

export type AdminNavGroup = 'main' | 'content' | 'ops' | 'system';

export type AdminNavDef = {
  href: string;
  label: string;
  group: AdminNavGroup;
  icon: string;
  hint: string;
  keywords: string;
  requiredPermission?: ModeratorPermission | ModeratorPermission[] | 'ADMIN_ONLY';
  badgeKey?: string;
};

export const ADMIN_NAV_GROUP_LABELS: Record<AdminNavGroup, string> = {
  main: 'Обзор',
  content: 'Контент',
  ops: 'Операции',
  system: 'Система',
};

export const ADMIN_NAV_ITEMS: AdminNavDef[] = [
  {
    href: '/admin',
    label: 'Дашборд',
    icon: 'LayoutDashboard',
    group: 'main',
    hint: 'Сводка и быстрый вход',
    keywords: 'главная обзор home dashboard сводка',
  },
  {
    href: '/admin/projects',
    label: 'Проекты',
    icon: 'Folder',
    requiredPermission: 'projects',
    group: 'content',
    hint: 'Карточки и модерация проектов',
    keywords: 'проект project',
  },
  {
    href: '/admin/clubs',
    label: 'Клубы',
    icon: 'Users',
    requiredPermission: 'clubs',
    group: 'content',
    hint: 'Клубы и состав',
    keywords: 'клуб club кружок',
  },
  {
    href: '/admin/spaces',
    label: 'Пространства',
    icon: 'Calendar',
    requiredPermission: 'spaces',
    group: 'content',
    hint: 'Площадки и залы',
    keywords: 'зал коворкинг бронь space hall',
  },
  {
    href: '/admin/places',
    label: 'Куда сходить',
    icon: 'MapPin',
    requiredPermission: 'places',
    group: 'content',
    hint: 'Каталог мест Сочи',
    keywords: 'места place карта куда сходить',
  },
  {
    href: '/admin/programs',
    label: 'Гранты и добро',
    icon: 'HandHeart',
    requiredPermission: ['programs', 'pages'],
    group: 'content',
    hint: 'Программы, гранты, добро',
    keywords: 'грант добро волонтер программа',
  },
  {
    href: '/admin/pages',
    label: 'Страницы',
    icon: 'ScrollText',
    requiredPermission: 'pages',
    group: 'content',
    hint: 'CMS-страницы портала',
    keywords: 'cms страница текст',
  },
  {
    href: '/admin/faq',
    label: 'FAQ',
    icon: 'FileText',
    requiredPermission: 'pages',
    group: 'content',
    hint: 'Вопросы и ответы',
    keywords: 'faq справка вопросы ответы',
  },
  {
    href: '/admin/about-team',
    label: 'Команда «О нас»',
    icon: 'Users',
    requiredPermission: ['pages', 'portfolios'],
    group: 'content',
    hint: 'Команда на странице «О нас»',
    keywords: 'команда about о нас сотрудники',
  },
  {
    href: '/admin/documents',
    label: 'Документы',
    icon: 'FileStack',
    requiredPermission: 'pages',
    group: 'content',
    hint: 'Файлы и шаблоны',
    keywords: 'документ файл pdf',
  },
  {
    href: '/admin/news',
    label: 'Новости',
    icon: 'Newspaper',
    requiredPermission: ['news', 'pages'],
    group: 'content',
    hint: 'Лента новостей',
    keywords: 'новость news пост',
  },
  {
    href: '/admin/bookings',
    label: 'Афиша',
    icon: 'Clock',
    requiredPermission: 'bookings',
    group: 'ops',
    badgeKey: '/admin/bookings',
    hint: 'События и записи',
    keywords: 'афиша событие мероприятие бронь booking',
  },
  {
    href: '/admin/occupancy',
    label: 'Занятость залов',
    icon: 'CalendarRange',
    requiredPermission: 'bookings',
    group: 'ops',
    hint: 'Сетка занятости',
    keywords: 'занятость слот зал календарь occupancy',
  },
  {
    href: '/admin/applications',
    label: 'Заявки',
    icon: 'FileText',
    requiredPermission: 'applications',
    group: 'ops',
    badgeKey: '/admin/applications',
    hint: 'Вступления и отклики',
    keywords: 'заявка application вступление',
  },
  {
    href: '/admin/portfolios',
    label: 'Портфолио',
    icon: 'Briefcase',
    requiredPermission: ['portfolios', 'pages'],
    group: 'ops',
    badgeKey: '/admin/portfolios',
    hint: 'Проверка портфолио',
    keywords: 'портфолио грамота опыт',
  },
  {
    href: '/admin/awards',
    label: 'Награды',
    icon: 'Award',
    requiredPermission: ['portfolios', 'pages'],
    group: 'ops',
    hint: 'Дипломы и грамоты',
    keywords: 'награда диплом грамота award',
  },
  {
    href: '/admin/vacancies',
    label: 'Вакансии',
    icon: 'Briefcase',
    requiredPermission: 'vacancies',
    group: 'ops',
    hint: 'Вакансии и отклики',
    keywords: 'вакансия работа vacancy',
  },
  {
    href: '/admin/contests',
    label: 'Конкурсы',
    icon: 'Trophy',
    requiredPermission: 'contests',
    group: 'ops',
    hint: 'Конкурсы и победители',
    keywords: 'конкурс contest соревнование',
  },
  {
    href: '/admin/moderation',
    label: 'Модерация',
    icon: 'ShieldAlert',
    requiredPermission: 'moderation',
    group: 'ops',
    badgeKey: '/admin/moderation',
    hint: 'Жалобы и флаги',
    keywords: 'модерация жалоба флаг контент',
  },
  {
    href: '/admin/security',
    label: 'IP и подозрительные',
    icon: 'Shield',
    requiredPermission: ['moderation'],
    group: 'ops',
    hint: 'IP, сессии, риск',
    keywords: 'ip безопасность security подозрительные',
  },
  {
    href: '/admin/stats',
    label: 'Статистика',
    icon: 'BarChart3',
    requiredPermission: ['stats', 'bookings'],
    group: 'ops',
    hint: 'Цифры портала',
    keywords: 'статистика график stats аналитика',
  },
  {
    href: '/admin/scanner',
    label: 'Сканер',
    icon: 'ScanLine',
    requiredPermission: 'scanner',
    group: 'ops',
    hint: 'QR на входе',
    keywords: 'сканер qr билет вход checkin',
  },
  {
    href: '/admin/users',
    label: 'Пользователи',
    icon: 'Users',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Учётные записи',
    keywords: 'пользователь юзер аккаунт user',
  },
  {
    href: '/admin/pending-users',
    label: 'Заявки регистрации',
    icon: 'UserPlus',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Новые регистрации',
    keywords: 'регистрация pending модерация входа',
  },
  {
    href: '/admin/audit-log',
    label: 'Журнал админов',
    icon: 'ScrollText',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Действия сотрудников',
    keywords: 'журнал аудит лог admin log',
  },
  {
    href: '/admin/rkn',
    label: 'РКН / ПДн',
    icon: 'FileText',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Персональные данные',
    keywords: 'ркн пдн 152 персональные данные',
  },
  {
    href: '/admin/backup',
    label: 'Бэкап',
    icon: 'DatabaseBackup',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Резервные копии',
    keywords: 'бэкап backup копия',
  },
  {
    href: '/admin/bots',
    label: 'Боты',
    icon: 'Bot',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Telegram и MAX',
    keywords: 'бот telegram max',
  },
  {
    href: '/admin/system',
    label: 'Состояние сервера',
    icon: 'Server',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Сервер и модули',
    keywords: 'сервер system здоровье uptime',
  },
  {
    href: '/admin/online',
    label: 'Онлайн',
    icon: 'UsersRound',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Кто сейчас на сайте',
    keywords: 'онлайн online присутствие',
  },
  {
    href: '/admin/activity',
    label: 'Активность',
    icon: 'Activity',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Лента действий',
    keywords: 'активность activity лента',
  },
  {
    href: '/admin/settings',
    label: 'Настройки сайта',
    icon: 'Settings',
    requiredPermission: 'ADMIN_ONLY',
    group: 'system',
    hint: 'Бренд, модули, тексты',
    keywords: 'настройки settings конфиг сайт',
  },
];

export function normalizeAdminQuery(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s/.-]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function scoreAdminNavItem(item: AdminNavDef, query: string): number {
  const q = normalizeAdminQuery(query);
  if (!q) return 1;
  const label = normalizeAdminQuery(item.label);
  const keys = normalizeAdminQuery(`${item.keywords} ${item.hint}`);
  const href = normalizeAdminQuery(item.href.replace('/admin/', ''));
  if (label === q) return 100;
  if (label.startsWith(q)) return 86;
  if (` ${keys} `.includes(` ${q} `)) return 72;
  if (label.includes(q)) return 64;
  if (keys.startsWith(q) || keys.includes(` ${q}`)) return 54;
  if (href.includes(q) || keys.includes(q)) return 40;
  const tokens = q.split(' ').filter(Boolean);
  if (tokens.length > 1 && tokens.every((t) => label.includes(t) || keys.includes(t) || href.includes(t))) {
    return 36;
  }
  return 0;
}

export function filterAdminNav(items: AdminNavDef[], query: string): AdminNavDef[] {
  const q = normalizeAdminQuery(query);
  if (!q) return items;
  return items
    .map((item) => ({ item, score: scoreAdminNavItem(item, q) }))
    .filter((row) => row.score > 0)
    .sort((a, b) => b.score - a.score || a.item.label.localeCompare(b.item.label, 'ru'))
    .map((row) => row.item);
}
