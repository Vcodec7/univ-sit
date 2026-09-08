'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ChevronRight, Search } from 'lucide-react';
import { APP_VERSION } from '@/lib/app-version';
import { adminBreadcrumbs } from '@/lib/admin-breadcrumbs';

function openAdminCmdk() {
  window.dispatchEvent(new Event('yp-admin-cmdk'));
}

export function AdminTopBar({ userName }: { userName?: string | null }) {
  const pathname = usePathname() || '/admin';
  const crumbs = adminBreadcrumbs(pathname);
  const [healthy, setHealthy] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/health', { credentials: 'same-origin' })
      .then((r) => (cancelled ? null : setHealthy(r.ok)))
      .catch(() => {
        if (!cancelled) setHealthy(false);
      });
    return () => {
      cancelled = true;
    };
  }, [pathname]);

  return (
    <header className="admin-topbar">
      <nav className="admin-topbar__crumbs" aria-label="Навигация раздела">
        {crumbs.map((c, i) => (
          <span key={`${c.href}-${i}`} className="admin-topbar__crumb">
            {i > 0 ? <ChevronRight size={14} aria-hidden /> : null}
            {i === crumbs.length - 1 ? (
              <span aria-current="page">{c.label}</span>
            ) : (
              <Link href={c.href}>{c.label}</Link>
            )}
          </span>
        ))}
      </nav>
      <div className="admin-topbar__tools">
        <button type="button" className="admin-topbar__search" onClick={openAdminCmdk}>
          <Search size={16} aria-hidden />
          Поиск
          <kbd>Ctrl K</kbd>
        </button>
        <span
          className={`admin-health${healthy === false ? ' is-down' : healthy ? ' is-up' : ''}`}
          title="Статус /api/health"
        >
          {healthy === false ? 'Сбой системы' : 'Система активна'}
        </span>
        {userName ? (
          <Link href="/dashboard" className="admin-topbar__user" title="Профиль">
            {userName}
          </Link>
        ) : null}
      </div>
    </header>
  );
}

export function AdminFooter() {
  return (
    <footer className="admin-footer">
      <span>© Молодёжь Сочи</span>
      <span title="YoungPortal">версия {APP_VERSION}</span>
      <a href="/api/health">Состояние API</a>
      <a href="/contacts">Дежурный</a>
    </footer>
  );
}
