export type CabinetNavId =
  | 'overview'
  | 'showcase'
  | 'settings'
  | 'friends'
  | 'messages'
  | 'tickets'
  | 'applications'
  | 'portfolio'
  | 'referrals'
  | 'guides'
  | 'games'
  | 'shop'
  | 'achievements'
  | 'awards';

export type CabinetNavItem = {
  id: CabinetNavId;
  label: string;
  href: string;
  module?: string;
};

export type CabinetNavGroup = {
  group: string;
  items: CabinetNavItem[];
};

export const CABINET_NAV: CabinetNavGroup[] = [
  {
    group: 'Профиль',
    items: [
      { id: 'overview', label: 'Профиль', href: '/dashboard' },
      { id: 'showcase', label: 'Витрина', href: '/dashboard/showcase' },
      { id: 'settings', label: 'Настройки', href: '/dashboard/settings' },
    ],
  },
  {
    group: 'Кабинет',
    items: [
      { id: 'friends', label: 'Друзья', href: '/friends', module: 'friends' },
      { id: 'messages', label: 'Сообщения', href: '/messages', module: 'messaging' },
      { id: 'tickets', label: 'Билеты', href: '/tickets', module: 'events' },
      { id: 'applications', label: 'Заявки', href: '/dashboard/applications', module: 'applications' },
      { id: 'portfolio', label: 'Портфолио', href: '/dashboard/portfolio', module: 'portfolio' },
      { id: 'referrals', label: 'Рефералы', href: '/dashboard/referrals', module: 'referrals' },
      { id: 'guides', label: 'Инструктажи', href: '/dashboard/guides' },
      { id: 'games', label: 'Игры', href: '/dashboard/games', module: 'games' },
    ],
  },
  {
    group: 'Прогресс',
    items: [
      { id: 'shop', label: 'Магазин', href: '/dashboard/shop', module: 'eco' },
      { id: 'achievements', label: 'Достижения', href: '/dashboard/achievements', module: 'achievements' },
      { id: 'awards', label: 'Награды', href: '/dashboard/awards', module: 'achievements' },
    ],
  },
];

export function cabinetNavIdFromPath(pathname: string): CabinetNavId {
  const p = pathname.replace(/\/+$/, '') || '/';
  if (p === '/dashboard') return 'overview';
  if (p.startsWith('/dashboard/settings')) return 'settings';
  if (p.startsWith('/dashboard/showcase')) return 'showcase';
  if (p.startsWith('/dashboard/applications')) return 'applications';
  if (p.startsWith('/dashboard/portfolio')) return 'portfolio';
  if (p.startsWith('/dashboard/referrals')) return 'referrals';
  if (p.startsWith('/dashboard/guides')) return 'guides';
  if (p.startsWith('/dashboard/games')) return 'games';
  if (p.startsWith('/dashboard/shop')) return 'shop';
  if (p.startsWith('/dashboard/achievements')) return 'achievements';
  if (p.startsWith('/dashboard/awards')) return 'awards';
  if (p.startsWith('/friends')) return 'friends';
  if (p.startsWith('/messages')) return 'messages';
  if (p.startsWith('/tickets')) return 'tickets';
  return 'overview';
}
