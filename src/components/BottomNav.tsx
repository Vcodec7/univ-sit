'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useLayoutEffect, useState } from 'react';
import {
  Gamepad2,
  Home,
  MessageCircle,
  Search,
  UserRound,
  Users,
} from 'lucide-react';

import { fetchPublicStatusCached } from '@/lib/public-status-client';
import { persistSessionHint } from '@/lib/session-hint';

type Tab = {
  href: string;
  label: string;
  icon: typeof Home;
  match: (path: string) => boolean;
  badge?: number;
};

const NAV_H_VAR = '--yp-bottom-nav-h';

function persistDock(on: boolean) {
  try {
    if (on) localStorage.setItem('yp-dock', '1');
    else localStorage.removeItem('yp-dock');
  } catch {
    /* ignore */
  }
}

function setDockClass(on: boolean) {
  document.body.classList.toggle('has-bottom-nav', on);
  document.documentElement.classList.toggle('has-bottom-nav', on);
  if (!on) document.documentElement.style.removeProperty(NAV_H_VAR);
}

/**
 * Mobile bottom bar for signed-in users.
 * Sochi coastal brand — not a VK clone (teal accents, own labels/icons).
 *
 * Clearance model (auth mobile):
 * 1) fixed `.yp-bottom-nav`
 * 2) in-flow `.yp-bottom-nav-space` after Footer (same height)
 * 3) `--yp-bottom-nav-h` measured from the real bar (ResizeObserver)
 * so footer / eco / legal never sit under the dock.
 */
export default function BottomNav() {
  const { data: session, status } = useSession();
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [modules, setModules] = useState<Record<string, boolean> | null>(null);
  const [dockHint, setDockHint] = useState(false);

  useLayoutEffect(() => {
    setDockHint(document.documentElement.classList.contains('has-bottom-nav'));
  }, []);

  const role = (session?.user as { role?: string } | undefined)?.role;
  const hideForRole = role === 'SCANNER' || role === 'TECH';
  const onGamesHub = pathname === '/games' || pathname === '/games/';
  const immersive =
    (pathname.startsWith('/games') && !onGamesHub) ||
    pathname.startsWith('/admin') ||
    pathname.startsWith('/ops') ||
    pathname.startsWith('/scanner') ||
    pathname.startsWith('/presentation/view') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/register') ||
    pathname.startsWith('/verify') ||
    pathname.startsWith('/maintenance');

  const visible =
    !immersive &&
    !hideForRole &&
    ((status === 'authenticated' && !!session?.user) || (status === 'loading' && dockHint));

  useEffect(() => {
    router.prefetch('/dashboard');
    router.prefetch('/messages');
  }, [router]);

  useEffect(() => {
    let cancelled = false;
    fetchPublicStatusCached()
      .then((d) => {
        if (cancelled || !d?.modules || typeof d.modules !== 'object') return;
        setModules(d.modules as Record<string, boolean>);
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  const modOn = (key: string) => modules == null || modules[key] !== false;

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.id || hideForRole) return;
    let cancelled = false;
    const load = () => {
      if (document.visibilityState === 'hidden') return;
      fetch('/api/messages?lite=1', { cache: 'default' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (cancelled) return;
          if (typeof d?.unreadTotal === 'number') {
            setUnread(d.unreadTotal);
            return;
          }
          const list = Array.isArray(d?.conversations)
            ? d.conversations
            : Array.isArray(d)
              ? d
              : [];
          const sum = list.reduce(
            (acc: number, row: { unreadCount?: number }) =>
              acc + (Number(row.unreadCount) || 0),
            0
          );
          setUnread(sum);
        })
        .catch(() => undefined);
    };
    load();
    const t = window.setInterval(load, 90_000);
    return () => {
      cancelled = true;
      window.clearInterval(t);
    };
  }, [status, session?.user?.id, hideForRole]);

  useLayoutEffect(() => {
    if (status === 'loading') return;
    if (!visible) {
      setDockClass(false);
      if (status === 'unauthenticated' || hideForRole) persistDock(false);
      return;
    }
    setDockClass(true);
    persistDock(true);
    persistSessionHint(true);
  }, [visible, status]);

  if (!visible) {
    return null;
  }

  const tabs: Tab[] = [
    {
      href: '/',
      label: 'Главная',
      icon: Home,
      match: (p) => p === '/',
    },
    {
      href: '/search',
      label: 'Поиск',
      icon: Search,
      match: (p) => p.startsWith('/search'),
    },
    ...(modOn('messaging')
      ? [
          {
            href: '/messages',
            label: 'Сообщения',
            icon: MessageCircle,
            match: (p: string) => p.startsWith('/messages'),
            badge: unread,
          } satisfies Tab,
        ]
      : []),
    ...(modOn('friends')
      ? [
          {
            href: '/friends',
            label: 'Друзья',
            icon: Users,
            match: (p: string) => p.startsWith('/friends'),
          } satisfies Tab,
        ]
      : modOn('games')
        ? [
            {
              href: '/games',
              label: 'Игры',
              icon: Gamepad2,
              match: (p: string) => p.startsWith('/games'),
            } satisfies Tab,
          ]
        : []),
    {
      href: '/dashboard',
      label: 'Профиль',
      icon: UserRound,
      match: (p) =>
        p.startsWith('/more') ||
        p.startsWith('/dashboard') ||
        p.startsWith('/u/') ||
        (!modOn('friends') && p.startsWith('/friends')) ||
        p.startsWith('/tickets'),
    },
  ];

  return (
    <>
      <nav
        className="yp-bottom-nav"
        aria-label="Основная навигация"
      >
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href + tab.label}
              href={tab.href}
              prefetch
              className={`yp-bottom-nav__item${active ? ' is-active' : ''}`}
              aria-current={active ? 'page' : undefined}
            >
              <span className="yp-bottom-nav__icon-wrap">
                <Icon size={22} strokeWidth={active ? 2.35 : 1.85} aria-hidden />
                {tab.badge && tab.badge > 0 ? (
                  <span className="yp-bottom-nav__badge">
                    {tab.badge > 99 ? '99+' : tab.badge}
                  </span>
                ) : null}
              </span>
              <span className="yp-bottom-nav__label">{tab.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
