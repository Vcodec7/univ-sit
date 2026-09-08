'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, useState, type ReactNode } from 'react';
import CabinetMenu from '@/components/CabinetMenu';

/**
 * Persistent cabinet chrome. Lives in /dashboard/layout so the sidebar
 * does not unmount (and loading.tsx does not wipe it) on every leaf route.
 */
export default function CabinetShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '/dashboard';
  const role = (session?.user as { role?: string } | undefined)?.role;
  const isOverview = pathname.replace(/\/+$/, '') === '/dashboard';
  const [wide, setWide] = useState(false);

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === 'authenticated' && role === 'SCANNER') router.replace('/scanner');
    if (status === 'authenticated' && role === 'TECH') router.replace('/ops');
  }, [status, router, pathname, role]);

  useEffect(() => {
    const mq = window.matchMedia('(min-width: 900px)');
    const sync = () => setWide(mq.matches);
    sync();
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  if (status === 'unauthenticated') return null;

  return (
    <main className="container dashboard-page cabinet-subpage">
      {wide ? null : <CabinetMenu variant="strip" role={role} />}
      <div
        className={`dashboard-layout dashboard-shell hide-aside-mobile${isOverview ? ' is-overview' : ''}`}
      >
        {wide ? <CabinetMenu role={role} /> : null}
        <div className="dashboard-main">
          {status === 'loading' ? (
            <div className="svc-skel" aria-busy="true" aria-label="Загрузка кабинета">
              <div className="svc-skel__pill" />
              <div className="svc-skel__row" />
              <div className="svc-skel__row" />
            </div>
          ) : (
            children
          )}
        </div>
      </div>
    </main>
  );
}
