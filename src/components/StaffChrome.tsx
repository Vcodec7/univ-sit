'use client';

import { useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Immersive chrome for admin + ops (hides public glass-nav via body.is-admin). */
export default function StaffChrome() {
  const pathname = usePathname() || '';
  const staff =
    pathname.startsWith('/admin') || pathname.startsWith('/ops') || pathname.startsWith('/scanner');

  useLayoutEffect(() => {
    document.body.classList.toggle('is-admin', staff);
    document.documentElement.classList.toggle('is-admin', staff);
    return () => {
      document.body.classList.remove('is-admin');
      document.documentElement.classList.remove('is-admin');
    };
  }, [staff]);

  return null;
}
