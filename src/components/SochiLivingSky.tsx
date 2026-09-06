'use client';

import { useEffect, useState } from 'react';
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
  const [sky, setSky] = useState<SochiSky>(() => resolveSochiSky());

  useEffect(() => {
    const tick = () => setSky(resolveSochiSky());
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, []);

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
      />
      <div className="sochi-sky__swell sochi-sky__swell--a" />
      <div className="sochi-sky__swell sochi-sky__swell--b" />
      <div className="sochi-sky__swell sochi-sky__swell--c" />
      <svg className="sochi-sky__birds" viewBox="0 0 240 40" fill="none">
        <path d="M4 22c6-8 12-8 18 0-6-3-12-3-18 0Z" />
        <path d="M38 14c7-9 14-9 20 0-7-3-13-3-20 0Z" />
        <path d="M78 20c5-7 11-7 16 0-5-2-11-2-16 0Z" />
      </svg>
      <svg className="sochi-sky__dolphin" viewBox="0 0 64 40" fill="none">
        <path
          fill="currentColor"
          d="M6 28c8-2 16-14 28-16 6-1 12 2 18 8-7-1-12 2-14 6-6 2-12 4-20 4-6 0-10-1-12-2Zm28-16c2-6 8-10 10-8-4 3-6 6-8 10Z"
        />
      </svg>
    </div>
  );
}
