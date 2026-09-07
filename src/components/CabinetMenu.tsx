'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  ChevronDown,
  Crown,
  FileText,
  Gamepad2,
  Gift,
  Home,
  LayoutGrid,
  Leaf,
  LogOut,
  MessageCircle,
  Shield,
  ShoppingBag,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { signOutLogged } from '@/lib/sign-out-logged';
import { fetchPublicStatusCached } from '@/lib/public-status-client';
import {
  CABINET_NAV,
  cabinetLeafIdFromPath,
  cabinetNavIdFromPath,
  type CabinetNavId,
  type CabinetNavItem,
  type CabinetNavLeaf,
} from '@/lib/cabinet-nav';

const ICONS = {
  overview: User,
  showcase: LayoutGrid,
  settings: FileText,
  social: MessageCircle,
  friends: Users,
  messages: MessageCircle,
  bookings: Ticket,
  tickets: Ticket,
  applications: FileText,
  portfolio: Briefcase,
  referrals: Gift,
  guides: BookOpen,
  games: Gamepad2,
  shop: ShoppingBag,
  progress: Award,
  achievements: Award,
  awards: Award,
  more: ChevronDown,
} as const;

type Props = {
  current?: CabinetNavId;
  upcomingCount?: number;
  unreadMessages?: number;
  achievementLegend?: boolean;
  ecoPoints?: number;
  role?: string | null;
  showFoot?: boolean;
  variant?: 'aside' | 'strip';
};

export default function CabinetMenu({
  current,
  upcomingCount = 0,
  unreadMessages = 0,
  achievementLegend = false,
  ecoPoints,
  role,
  showFoot = true,
  variant = 'aside',
}: Props) {
  const pathname = usePathname() || '/dashboard';
  const activeId = current || cabinetNavIdFromPath(pathname);
  const leafId = cabinetLeafIdFromPath(pathname);
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean> | null>(null);
  const [moreOpen, setMoreOpen] = useState(activeId === 'more');

  useEffect(() => {
    fetchPublicStatusCached()
      .then((d) => {
        if (d?.modules && typeof d.modules === 'object') setModuleFlags(d.modules as Record<string, boolean>);
        else setModuleFlags({});
      })
      .catch(() => setModuleFlags({}));
  }, []);

  useEffect(() => {
    if (activeId === 'more') setMoreOpen(true);
  }, [activeId]);

  const modOn = (key?: string) => !key || moduleFlags == null || moduleFlags[key] !== false;
  const isStaff = role === 'ADMIN' || role === 'MODERATOR';

  const filterLeaf = (item: CabinetNavLeaf) => {
    if (item.id === 'social') return modOn('messaging') || modOn('friends');
    if (item.id === 'bookings') return modOn('events') || modOn('applications');
    return modOn(item.module);
  };

  const resolveHref = (item: CabinetNavItem) => {
    if (item.id === 'social' && !modOn('messaging')) return '/dashboard/friends';
    if (item.id === 'bookings' && !modOn('events')) return '/dashboard/applications';
    return item.href;
  };

  const groups = CABINET_NAV.map((section) => ({
    ...section,
    items: section.items
      .map((item) => {
        if (!item.children) return item;
        return { ...item, children: item.children.filter(filterLeaf) };
      })
      .filter((item) => {
        if (item.children) return item.children.length > 0;
        return filterLeaf(item);
      }),
  })).filter((section) => section.items.length > 0);

  const renderLink = (item: CabinetNavLeaf, compact?: boolean, hrefOverride?: string) => {
    const Icon = ICONS[item.id] || FileText;
    const href = hrefOverride || item.href;
    const active = item.id === activeId || item.id === leafId;
    const showMsgBadge = (item.id === 'social' || item.id === 'messages') && unreadMessages > 0;
    const showTicketBadge = (item.id === 'bookings' || item.id === 'tickets') && upcomingCount > 0;
    return (
      <Link
        key={item.id}
        href={href}
        title={item.label}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        prefetch
        className={`dashboard-nav-btn${active ? ' is-active' : ''}${
          item.id === 'progress' || item.id === 'achievements' ? ' is-achievements' : ''
        }${compact ? ' cabinet-rail-strip__btn' : ''}`}
      >
        <span className="dashboard-nav-icon-wrap">
          <Icon size={compact ? 16 : 17} />
          {showTicketBadge ? (
            <span className="dashboard-nav-badge">{upcomingCount > 999 ? '999+' : upcomingCount}</span>
          ) : null}
          {showMsgBadge ? (
            <span className="dashboard-nav-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
          ) : null}
          {(item.id === 'progress' || item.id === 'achievements') && achievementLegend ? (
            <Crown size={11} color="#ca8a04" className="dashboard-nav-crown" aria-hidden />
          ) : null}
        </span>
        <span className="dashboard-nav-label">{item.label}</span>
      </Link>
    );
  };

  const renderMore = (item: CabinetNavItem, compact?: boolean) => {
    const kids = item.children || [];
    if (!kids.length) return null;
    if (compact) {
      return (
        <details key="more" className="cabinet-rail-more" open={activeId === 'more'}>
          <summary className="cabinet-rail-strip__btn dashboard-nav-btn">{item.label}</summary>
          <div className="cabinet-rail-more__list">
            {kids.map((child) => renderLink(child, true))}
          </div>
        </details>
      );
    }
    return (
      <div key="more" className="dashboard-nav-more">
        <button
          type="button"
          className={`dashboard-nav-btn${activeId === 'more' ? ' is-active' : ''}`}
          aria-expanded={moreOpen}
          onClick={() => setMoreOpen((v) => !v)}
        >
          <span className="dashboard-nav-icon-wrap">
            <ChevronDown size={17} className={moreOpen ? 'dashboard-nav-more__chev is-open' : 'dashboard-nav-more__chev'} />
          </span>
          <span className="dashboard-nav-label">{item.label}</span>
        </button>
        {moreOpen
          ? kids.map((child) => (
              <Link
                key={child.id}
                href={child.href}
                className={`dashboard-nav-more__link${leafId === child.id ? ' is-on' : ''}`}
                prefetch
              >
                {child.label}
              </Link>
            ))
          : null}
      </div>
    );
  };

  const renderItem = (item: CabinetNavItem, compact?: boolean) => {
    if (item.children?.length) return renderMore(item, compact);
    return renderLink(item, compact, resolveHref(item));
  };

  if (variant === 'strip') {
    return (
      <nav className="cabinet-rail-strip" aria-label="Разделы кабинета">
        {groups.flatMap((section) => section.items.map((item) => renderItem(item, true)))}
      </nav>
    );
  }

  return (
      <aside className="glass dashboard-aside dashboard-aside--nav" aria-label="Кабинет">
        <nav className="dashboard-menu" aria-label="Меню кабинета">
          {groups.map((section) => (
            <div key={section.group} className="dashboard-menu__group">
              <p className="dashboard-aside-nav-label">{section.group}</p>
              <div className="dashboard-nav dashboard-nav--labeled">
                {section.items.map((item) => renderItem(item))}
              </div>
            </div>
          ))}
        </nav>
        {showFoot ? (
          <div className="dashboard-aside-foot">
            {modOn('eco') && typeof ecoPoints === 'number' ? (
              <Link href="/dashboard/shop" className="dashboard-aside-eco" title="Кошелёк магазина">
                <Leaf size={15} />
                <span>кошелёк</span>
                <strong>{ecoPoints.toLocaleString('ru-RU')}</strong>
              </Link>
            ) : null}
            <Link href="/" className="dashboard-aside-foot-link dashboard-aside-foot-link--home">
              <Home size={16} /> На главную
            </Link>
            {isStaff ? (
              <Link href="/admin" className="dashboard-admin-btn">
                <Shield size={16} /> Панель
              </Link>
            ) : null}
            <button
              type="button"
              className="dashboard-aside-foot-link dashboard-aside-foot-link--logout"
              onClick={() => void signOutLogged({ callbackUrl: '/' })}
            >
              <LogOut size={16} /> Выйти
            </button>
          </div>
        ) : null}
      </aside>
  );
}
