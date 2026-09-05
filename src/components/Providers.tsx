'use client';

import { useEffect, useLayoutEffect } from 'react';
import { SessionProvider, useSession } from 'next-auth/react';
import { flushGameScoreQueue } from '@/lib/game-scores-client';
import EcoAwardToast from '@/components/EcoAwardToast';
import QuickAccess from '@/components/QuickAccess';
import InstructionsWelcomeModal from '@/components/InstructionsWelcomeModal';
import { VoiceProvider } from '@/components/VoiceProvider';

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

function GameScoreSync() {
  useEffect(() => {
    const sync = () => {
      void flushGameScoreQueue();
    };
    sync();
    window.addEventListener('online', sync);
    return () => window.removeEventListener('online', sync);
  }, []);
  return null;
}

function PresenceHeartbeat() {
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status !== 'authenticated') return;
    const role = (session?.user as { role?: string } | undefined)?.role;
    // Scanner/TECH don't need presence chatter — was flooding 429s and RAM
    if (role === 'SCANNER' || role === 'TECH') return;

    let cancelled = false;
    let backoffMs = 180_000;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let inFlight = false;

    const schedule = (ms: number) => {
      if (cancelled) return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void ping(), ms);
    };

    const ping = async () => {
      if (cancelled || inFlight) return;
      if (document.visibilityState === 'hidden') {
        schedule(backoffMs);
        return;
      }
      inFlight = true;
      try {
        const r = await fetch('/api/user/presence', { method: 'POST' });
        if (r.status === 429) backoffMs = Math.min(600_000, Math.max(backoffMs * 2, 300_000));
        else backoffMs = 180_000;
      } catch {
        backoffMs = Math.min(600_000, backoffMs + 60_000);
      } finally {
        inFlight = false;
        schedule(backoffMs);
      }
    };

    schedule(12_000);
    const onVis = () => {
      // Don't stampede on tab focus — only resume the scheduled loop
      if (document.visibilityState === 'visible' && !timer && !inFlight) {
        schedule(5_000);
      }
    };
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVis);
    };
  }, [status, session?.user]);

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
        {!minimal && <GameScoreSync />}
        {!minimal && <PresenceHeartbeat />}
        {!minimal && <EcoAwardToast />}
        {!minimal && <InstructionsWelcomeModal />}
        {!minimal && <QuickAccess />}
        {children}
      </VoiceProvider>
    </SessionProvider>
  );
}
