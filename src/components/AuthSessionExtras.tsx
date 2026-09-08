'use client';

import { useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import { flushGameScoreQueue } from '@/lib/game-scores-client';

const EcoAwardToast = dynamic(() => import('@/components/EcoAwardToast'), { ssr: false });
const InstructionsWelcomeModal = dynamic(() => import('@/components/InstructionsWelcomeModal'), {
  ssr: false,
});

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
    if (role === 'SCANNER' || role === 'TECH') return;

    let cancelled = false;
    let backoffMs = 50_000;
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
        const r = await fetch('/api/user/presence', {
          method: 'POST',
          credentials: 'same-origin',
          cache: 'no-store',
        });
        if (r.status === 429) backoffMs = Math.min(180_000, Math.max(backoffMs * 2, 90_000));
        else if (!r.ok) backoffMs = Math.min(120_000, backoffMs + 20_000);
        else backoffMs = 50_000;
      } catch {
        backoffMs = Math.min(180_000, backoffMs + 20_000);
      } finally {
        inFlight = false;
        schedule(backoffMs);
      }
    };

    schedule(12_000);
    const onVis = () => {
      if (document.visibilityState === 'visible' && !inFlight) {
        schedule(800);
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

/** Session-only chrome — not downloaded on /login until the user is signed in. */
export default function AuthSessionExtras() {
  const { status } = useSession();
  if (status !== 'authenticated') return null;
  return (
    <>
      <GameScoreSync />
      <PresenceHeartbeat />
      <EcoAwardToast />
      <InstructionsWelcomeModal />
    </>
  );
}
