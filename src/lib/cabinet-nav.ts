export type CabinetNavId =
  | 'overview'
  | 'showcase'
  | 'settings'
  | 'social'
  | 'friends'
  | 'messages'
  | 'bookings'
  | 'tickets'
  | 'applications'
  | 'portfolio'
  | 'referrals'
  | 'guides'
  | 'games'
  | 'shop'
  | 'progress'
  | 'achievements'
  | 'awards'
  | 'more';

export type CabinetNavLeaf = {
  id: CabinetNavId;
  label: string;
  href: string;
  module?: string;
};

export type CabinetNavItem = CabinetNavLeaf & {
  children?: CabinetNavLeaf[];
};

export type CabinetNavGroup = {
  group: string;
  items: CabinetNavItem[];
};

export const SOCIAL_TABS: CabinetNavLeaf[] = [
  { id: 'messages', label: 'Диалоги', href: '/dashboard/messages', module: 'messaging' },
  { id: 'friends', label: 'Друзья', href: '/dashboard/friends', module: 'friends' },
];

export const BOOKING_TABS: CabinetNavLeaf[] = [
  { id: 'tickets', label: 'Мои билеты', href: '/dashboard/tickets', module: 'events' },
  { id: 'applications', label: 'Мои заявки', href: '/dashboard/applications', module: 'applications' },
];

export const PROGRESS_TABS: CabinetNavLeaf[] = [
  { id: 'achievements', label: 'Значки', href: '/dashboard/achievements', module: 'achievements' },
  { id: 'awards', label: 'Награды', href: '/dashboard/awards', module: 'achievements' },
];

export const CABINET_NAV: CabinetNavGroup[] = [
  {
    group: 'Профиль',
    items: [
      { id: 'overview', label: 'Моя страница', href: '/dashboard' },
      { id: 'showcase', label: 'Витрина', href: '/dashboard/showcase' },
    ],
  },
  {
    group: 'Кабинет',
    items: [
      { id: 'social', label: 'Общение', href: '/dashboard/messages', module: 'messaging' },
      { id: 'bookings', label: 'Билеты и заявки', href: '/dashboard/tickets', module: 'events' },
      { id: 'games', label: 'Игры', href: '/dashboard/games', module: 'games' },
      {
        id: 'more',
        label: 'Ещё',
        href: '/dashboard/portfolio',
        children: [
          { id: 'portfolio', label: 'Портфолио', href: '/dashboard/portfolio', module: 'portfolio' },
          { id: 'referrals', label: 'Рефералы', href: '/dashboard/referrals', module: 'referrals' },
          { id: 'guides', label: 'Инструктажи', href: '/dashboard/guides' },
        ],
      },
    ],
  },
  {
    group: 'Прогресс и магазин',
    items: [
      { id: 'shop', label: 'Магазин', href: '/dashboard/shop', module: 'eco' },
      { id: 'progress', label: 'Мои достижения', href: '/dashboard/achievements', module: 'achievements' },
    ],
  },
];

export function cabinetNavIdFromPath(pathname: string): CabinetNavId {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/dashboard') return 'overview';
  if (p.startsWith('/dashboard/settings')) return 'settings';
  if (p.startsWith('/dashboard/showcase')) return 'showcase';
  if (p.startsWith('/dashboard/applications')) return 'bookings';
  if (p.startsWith('/dashboard/portfolio')) return 'more';
  if (p.startsWith('/dashboard/referrals')) return 'more';
  if (p.startsWith('/dashboard/guides')) return 'more';
  if (p.startsWith('/dashboard/games')) return 'games';
  if (p.startsWith('/dashboard/shop')) return 'shop';
  if (p.startsWith('/dashboard/achievements')) return 'progress';
  if (p.startsWith('/dashboard/awards')) return 'progress';
  if (p.startsWith('/dashboard/friends') || p.startsWith('/friends')) return 'social';
  if (p.startsWith('/dashboard/messages') || p.startsWith('/messages')) return 'social';
  if (p.startsWith('/dashboard/tickets') || p.startsWith('/tickets')) return 'bookings';
  return 'overview';
}

export function cabinetModuleOn(flags: Record<string, boolean> | null, key?: string) {
  return !key || flags == null || flags[key] !== false;
}

export function filterCabinetLeaves(items: CabinetNavLeaf[], flags: Record<string, boolean> | null) {
  return items.filter((item) => {
    if (item.id === 'social') return cabinetModuleOn(flags, 'messaging') || cabinetModuleOn(flags, 'friends');
    if (item.id === 'bookings') return cabinetModuleOn(flags, 'events') || cabinetModuleOn(flags, 'applications');
    return cabinetModuleOn(flags, item.module);
  });
}

export function cabinetLeafIdFromPath(pathname: string): CabinetNavId {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p.startsWith('/dashboard/friends') || p.startsWith('/friends')) return 'friends';
  if (p.startsWith('/dashboard/messages') || p.startsWith('/messages')) return 'messages';
  if (p.startsWith('/dashboard/applications')) return 'applications';
  if (p.startsWith('/dashboard/tickets') || p.startsWith('/tickets')) return 'tickets';
  if (p.startsWith('/dashboard/awards')) return 'awards';
  if (p.startsWith('/dashboard/achievements')) return 'achievements';
  if (p.startsWith('/dashboard/portfolio')) return 'portfolio';
  if (p.startsWith('/dashboard/referrals')) return 'referrals';
  if (p.startsWith('/dashboard/guides')) return 'guides';
  return cabinetNavIdFromPath(pathname);
}
