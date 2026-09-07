'use client';

import { useEffect, useState } from 'react';
import { isLiteMotionDevice } from '@/lib/prefer-lite-motion';
import { resolveSochiSky, type SochiSky } from '@/lib/sochi-sky';

const STARS = [
  [8, 12],
  [18, 22],
  [28, 9],
  [41, 18],
  [52, 8],
  [63, 16],
  [74, 11],
  [82, 24],
  [91, 14],
  [14, 32],
  [36, 28],
  [68, 30],
];

export default function SochiLivingSky() {
  const [enabled, setEnabled] = useState(false);
  const [sky, setSky] = useState<SochiSky>(() => resolveSochiSky());

  useEffect(() => {
    const sync = () => setEnabled(!isLiteMotionDevice());
    sync();
    const mq = window.matchMedia('(max-width: 900px), (pointer: coarse), (prefers-reduced-motion: reduce)');
    mq.addEventListener('change', sync);
    return () => mq.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const tick = () => setSky(resolveSochiSky());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <div className="sochi-sky" data-phase={sky.phase} aria-hidden>
      <div className="sochi-sky__grade" />
      <div className="sochi-sky__stars">
        {STARS.map(([x, y], i) => (
          <span key={i} style={{ left: `${x}%`, top: `${y}%`, animationDelay: `${i * 0.4}s` }} />
        ))}
      </div>
      <div
        className="sochi-sky__sun"
        style={{ left: `${sky.sunX}%`, top: `${sky.sunY}%`, opacity: sky.sunVisible ? 1 : 0 }}
      />
      <div
        className="sochi-sky__moon"
        style={{ left: `${sky.moonX}%`, top: `${sky.moonY}%`, opacity: sky.moonVisible ? 1 : 0 }}
      >
        <i />
        <i />
        <i />
      </div>
      <div className="sochi-sky__swell sochi-sky__swell--a" />
      <div className="sochi-sky__swell sochi-sky__swell--b" />
      <div className="sochi-sky__swell sochi-sky__swell--c" />
    </div>
  );
}
