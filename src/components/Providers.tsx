'use client';

import { useEffect, useLayoutEffect } from 'react';
import dynamic from 'next/dynamic';
import { SessionProvider, useSession } from 'next-auth/react';
import { VoiceProvider } from '@/components/VoiceProvider';

const AuthSessionExtras = dynamic(() => import('@/components/AuthSessionExtras'), { ssr: false });

function ChromePaintLock() {
  const { status } = useSession();
  useLayoutEffect(() => {
    document.documentElement.classList.add('yp-booting');
  }, []);
  useEffect(() => {
    if (status === 'loading') return;
    let frames = 0;
    let raf = 0;
    const tick = () => {
      frames += 1;
      if (frames < 2) {
        raf = requestAnimationFrame(tick);
        return;
      }
      document.documentElement.classList.remove('yp-booting');
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [status]);
  return null;
}

export function Providers({
  children,
  minimal = false,
}: {
  children: React.ReactNode;
  /** No FAB / heartbeat / score sync — maintenance stub & staff login */
  minimal?: boolean;
}) {
  return (
    <SessionProvider refetchInterval={0} refetchOnWindowFocus={false}>
      <VoiceProvider>
        {!minimal && <ChromePaintLock />}
        {!minimal && <AuthSessionExtras />}
        {children}
      </VoiceProvider>
    </SessionProvider>
  );
}
