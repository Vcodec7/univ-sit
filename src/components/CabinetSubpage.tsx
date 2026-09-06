'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import type { CabinetNavId } from '@/lib/cabinet-nav';

type Props = {
  title: string;
  lead?: string;
  children: ReactNode;
  section?: CabinetNavId;
};

/** Cabinet leaf content. Sidebar lives in dashboard layout (CabinetShell). */
export default function CabinetSubpage({ title, lead, children }: Props) {
  return (
    <>
      <header className="profile-subhead">
        <Link href="/dashboard" className="profile-subhead__back" aria-label="К профилю" prefetch>
          <ArrowLeft size={18} />
        </Link>
        <div className="profile-subhead__copy">
          <h1 className="profile-view__title">{title}</h1>
          {lead ? <p className="profile-view__lead">{lead}</p> : null}
        </div>
      </header>
      {children}
    </>
  );
}
