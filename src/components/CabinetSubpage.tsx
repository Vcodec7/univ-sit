'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useEffect, type ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import CabinetMenu from '@/components/CabinetMenu';
import type { CabinetNavId } from '@/lib/cabinet-nav';

type Props = {
  title: string;
  lead?: string;
  children: ReactNode;
  section?: CabinetNavId;
};

/** Lightweight cabinet leaf — no DashboardClient bundle. */
export default function CabinetSubpage({ title, lead, children, section }: Props) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname() || '/dashboard';
  const role = (session?.user as { role?: string } | undefined)?.role;

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?callbackUrl=${encodeURIComponent(pathname)}`);
      return;
    }
    if (status === 'authenticated' && role === 'SCANNER') router.replace('/scanner');
    if (status === 'authenticated' && role === 'TECH') router.replace('/ops');
  }, [status, session, router, pathname, role]);

  if (status === 'loading') {
    return (
      <main className="container dashboard-page cabinet-subpage">
        <div className="svc-skel" aria-busy="true" aria-label="Загрузка">
          <div className="svc-skel__pill" />
          <div className="svc-skel__row" />
          <div className="svc-skel__row" />
        </div>
      </main>
    );
  }

  if (status !== 'authenticated') return null;

  return (
    <main className="container dashboard-page cabinet-subpage">
      <CabinetMenu variant="strip" current={section} role={role} />
      <div className="dashboard-layout dashboard-shell hide-aside-mobile">
        <CabinetMenu current={section} role={role} />
        <div className="dashboard-main">
          <header className="profile-subhead">
            <Link href="/dashboard" className="profile-subhead__back" aria-label="К профилю">
              <ArrowLeft size={18} />
            </Link>
            <div className="profile-subhead__copy">
              <h1 className="profile-view__title">{title}</h1>
              {lead ? <p className="profile-view__lead">{lead}</p> : null}
            </div>
          </header>
          {children}
        </div>
      </div>
    </main>
  );
}
