'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  Award,
  BookOpen,
  Briefcase,
  Crown,
  FileText,
  Gamepad2,
  Gift,
  Home,
  LayoutGrid,
  Leaf,
  LogOut,
  Medal,
  MessageCircle,
  Settings,
  Shield,
  ShoppingBag,
  Ticket,
  User,
  Users,
} from 'lucide-react';
import { signOutLogged } from '@/lib/sign-out-logged';
import { fetchPublicStatusCached } from '@/lib/public-status-client';
import { CABINET_NAV, cabinetNavIdFromPath, type CabinetNavId } from '@/lib/cabinet-nav';

const ICONS = {
  overview: User,
  showcase: LayoutGrid,
  settings: Settings,
  friends: Users,
  messages: MessageCircle,
  tickets: Ticket,
  applications: FileText,
  portfolio: Briefcase,
  referrals: Gift,
  guides: BookOpen,
  games: Gamepad2,
  shop: ShoppingBag,
  achievements: Award,
  awards: Medal,
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
  const [moduleFlags, setModuleFlags] = useState<Record<string, boolean> | null>(null);

  useEffect(() => {
    fetchPublicStatusCached()
      .then((d) => {
        if (d?.modules && typeof d.modules === 'object') setModuleFlags(d.modules as Record<string, boolean>);
        else setModuleFlags({});
      })
      .catch(() => setModuleFlags({}));
  }, []);

  const modOn = (key?: string) => !key || moduleFlags == null || moduleFlags[key] !== false;
  const isStaff = role === 'ADMIN' || role === 'MODERATOR';

  const groups = CABINET_NAV.map((section) => ({
    ...section,
    items: section.items.filter((item) => modOn(item.module)),
  })).filter((section) => section.items.length > 0);

  const renderLink = (item: (typeof groups)[number]['items'][number], compact?: boolean) => {
    const Icon = ICONS[item.id];
    const active = item.id === activeId;
    return (
      <Link
        key={item.id}
        href={item.href}
        title={item.label}
        aria-label={item.label}
        aria-current={active ? 'page' : undefined}
        className={`dashboard-nav-btn${active ? ' is-active' : ''}${
          item.id === 'achievements' ? ' is-achievements' : ''
        }${compact ? ' cabinet-rail-strip__btn' : ''}`}
      >
        <span className="dashboard-nav-icon-wrap">
          <Icon size={compact ? 16 : 17} />
          {item.id === 'tickets' && upcomingCount > 0 ? (
            <span className="dashboard-nav-badge">{upcomingCount > 999 ? '999+' : upcomingCount}</span>
          ) : null}
          {item.id === 'messages' && unreadMessages > 0 ? (
            <span className="dashboard-nav-badge">{unreadMessages > 99 ? '99+' : unreadMessages}</span>
          ) : null}
          {item.id === 'achievements' && achievementLegend ? (
            <Crown size={11} color="#ca8a04" className="dashboard-nav-crown" aria-hidden />
          ) : null}
        </span>
        <span className="dashboard-nav-label">{item.label}</span>
      </Link>
    );
  };

  if (variant === 'strip') {
    return (
      <nav className="cabinet-rail-strip" aria-label="Разделы кабинета">
        {groups.flatMap((section) => section.items.map((item) => renderLink(item, true)))}
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
                {section.items.map((item) => renderLink(item))}
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
