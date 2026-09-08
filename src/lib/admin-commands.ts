import { ADMIN_NAV_ITEMS, filterAdminNav, type AdminNavDef } from '@/lib/admin-nav';
import { hasPermission, type ModeratorPermission } from '@/lib/acl-shared';

export type AdminCommand = {
  href: string;
  label: string;
  hint: string;
  keywords: string;
  requiredPermission?: AdminNavDef['requiredPermission'];
};

export const ADMIN_CREATE_COMMANDS: AdminCommand[] = [
  {
    href: '/admin/news?add=1',
    label: 'Создать новость',
    hint: 'Новый пост в ленте',
    keywords: 'создать новость пост news add',
    requiredPermission: ['news', 'pages'],
  },
  {
    href: '/admin/projects?add=true',
    label: 'Создать проект',
    hint: 'Новая карточка проекта',
    keywords: 'создать проект project add',
    requiredPermission: 'projects',
  },
  {
    href: '/admin/clubs?add=true',
    label: 'Создать клуб',
    hint: 'Новый клуб',
    keywords: 'создать клуб club add',
    requiredPermission: 'clubs',
  },
  {
    href: '/admin/bookings?add=1',
    label: 'Создать событие',
    hint: 'Афиша',
    keywords: 'создать событие мероприятие афиша',
    requiredPermission: 'bookings',
  },
  {
    href: '/admin/pages/new',
    label: 'Создать страницу',
    hint: 'CMS',
    keywords: 'создать страницу cms page add',
    requiredPermission: 'pages',
  },
  {
    href: '/admin/contests',
    label: 'Создать конкурс',
    hint: 'Конкурсы',
    keywords: 'создать конкурс contest add',
    requiredPermission: 'contests',
  },
  {
    href: '/admin/programs?add=true',
    label: 'Создать программу',
    hint: 'Гранты и добро',
    keywords: 'создать программу грант добро',
    requiredPermission: ['programs', 'pages'],
  },
];

export function canSeeAdminItem(
  item: { requiredPermission?: AdminNavDef['requiredPermission'] },
  userRole: string,
  userPermissions: string[]
): boolean {
  if (userRole === 'ADMIN') return true;
  if (item.requiredPermission === 'ADMIN_ONLY') return false;
  if (!item.requiredPermission) return true;
  return hasPermission('MODERATOR', userPermissions.join(','), item.requiredPermission as ModeratorPermission | ModeratorPermission[]);
}

export function searchAdminCommands(query: string, userRole: string, userPermissions: string[]): AdminCommand[] {
  const nav = ADMIN_NAV_ITEMS.filter((i) => canSeeAdminItem(i, userRole, userPermissions)).map((i) => ({
    href: i.href,
    label: i.label,
    hint: i.hint,
    keywords: `${i.keywords} ${i.label}`,
    requiredPermission: i.requiredPermission,
  }));
  const create = ADMIN_CREATE_COMMANDS.filter((i) => canSeeAdminItem(i, userRole, userPermissions));
  const all = [...create, ...nav];
  const asNav: AdminNavDef[] = all.map((c) => ({
    href: c.href,
    label: c.label,
    group: 'main',
    icon: 'Search',
    hint: c.hint,
    keywords: c.keywords,
    requiredPermission: c.requiredPermission,
  }));
  return filterAdminNav(asNav, query).map((i) => ({
    href: i.href,
    label: i.label,
    hint: i.hint,
    keywords: i.keywords,
    requiredPermission: i.requiredPermission,
  }));
}
