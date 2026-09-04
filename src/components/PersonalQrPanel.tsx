'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { Maximize2, RefreshCw, Sparkles, Wallet } from 'lucide-react';
import { POINTS } from '@/lib/points-labels';

type Scores = {
  mBall: number;
  ecoBall: number;
  ecoPoints?: number;
  ecoBallPublic: boolean;
  mLevel: { label: string; toNext: number; progress: number; nextLabel: string | null };
  ecoLevel: { label: string; toNext: number; progress: number; nextLabel: string | null };
};

type HistoryItem = {
  id: string;
  kind: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  createdAt: string;
};

function shopMilestone(points: number) {
  const n = Math.max(0, Math.floor(points || 0));
  const target = n < 50 ? 50 : n < 150 ? 150 : n < 400 ? 400 : n < 800 ? 800 : null;
  if (!target) {
    return { label: 'Магазин', toNext: 0, progress: 1, nextLabel: null as string | null };
  }
  const prev = target === 50 ? 0 : target === 150 ? 50 : target === 400 ? 150 : 400;
  return {
    label: 'Кошелёк',
    toNext: Math.max(0, target - n),
    progress: Math.min(1, (n - prev) / Math.max(1, target - prev)),
    nextLabel: `${target}`,
  };
}

export default function PersonalQrPanel() {
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (force = false) => {
    // First paint only — rotate keeps the current QR on screen.
    if (!force) setLoading(true);
    try {
      const r = await fetch('/api/presence-qr', {
        method: force ? 'POST' : 'GET',
        credentials: 'same-origin',
        headers: force ? { 'Content-Type': 'application/json' } : undefined,
        body: force ? JSON.stringify({ action: 'rotate' }) : undefined,
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data.message || 'Ошибка');
      const qr = data.qr || {};
      setUrl(qr.url || '');
      setExpiresAt(qr.expiresAt || null);
      if (data.scores) setScores(data.scores);
      if (data.history) setHistory(data.history);
      setError(null);
    } catch (e) {
      setError((e as Error).message || 'Не удалось загрузить QR');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    load(false);
  }, [load]);

  const shopLevel = shopMilestone(scores?.ecoPoints ?? 0);

  useEffect(() => {
    if (!fullscreen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFullscreen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [fullscreen]);

  const fs =
    mounted && fullscreen && url
      ? createPortal(
          <div
            className="presence-fs"
            role="dialog"
            aria-modal="true"
            aria-label="Пропуск на весь экран"
            onClick={() => setFullscreen(false)}
          >
            <button
              type="button"
              className="presence-fs-close"
              onClick={(e) => {
                e.stopPropagation();
                setFullscreen(false);
              }}
            >
              Закрыть
            </button>
            <div className="presence-fs__card" onClick={(e) => e.stopPropagation()}>
              <QRCodeDisplay value={url} size={420} />
              <p>Покажите сотруднику на входе</p>
              {expiresAt ? (
                <p className="presence-fs__until">
                  до {new Date(expiresAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                </p>
              ) : null}
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="presence-panel" aria-label="Личный QR и баллы">
      <div className="presence-grid presence-grid--svc">
        <div className="presence-points">
          <h2 className="presence-points__title">Баллы</h2>
          <p className="presence-points__hint">
            <strong>{POINTS.mBall.brand}</strong> — уровень участия.{' '}
            <strong>{POINTS.shop.brand}</strong> — кошелёк магазина, это разные счета.
          </p>
          <div className="presence-points__grid">
            <ScoreRing
              title={POINTS.mBall.brand}
              kicker="Уровень"
              icon={<Sparkles size={18} />}
              value={scores?.mBall ?? 0}
              level={scores?.mLevel}
              tone="m"
            />
            <Link href="/dashboard/shop" className="score-ring score-ring-shop score-ring-link" aria-label="Магазин мбаллов">
              <div className="score-ring-top">
                <Wallet size={18} />
                <strong>{POINTS.shop.brand}</strong>
              </div>
              <p className="presence-points__kicker">Кошелёк</p>
              <div className="score-ring-value">{(scores?.ecoPoints ?? 0).toLocaleString('ru-RU')}</div>
              <div className="score-ring-bar" aria-hidden>
                <span style={{ width: `${Math.round(shopLevel.progress * 100)}%` }} />
              </div>
              <p className="score-ring-meta">
                {shopLevel.nextLabel
                  ? `до ${shopLevel.nextLabel} ещё ${shopLevel.toNext}`
                  : 'можно тратить в магазине'}
              </p>
            </Link>
          </div>
        </div>

        <div className="presence-qr-card">
          <div className="presence-qr-head">
            <h2>Ваш пропуск</h2>
            <p>Покажите на входе. Токен обновляется раз в сутки.</p>
          </div>
          {loading && !url ? <p className="presence-muted">Готовим QR…</p> : null}
          {error ? <p className="presence-error">{error}</p> : null}
          {url ? (
            <div className="presence-qr-wrap">
              <QRCodeDisplay value={url} size={200} />
              <div className="presence-qr-actions">
                <button type="button" className="btn btn-primary" onClick={() => setFullscreen(true)}>
                  <Maximize2 size={16} /> На весь экран
                </button>
                <button type="button" className="btn btn-secondary" onClick={() => load(true)}>
                  <RefreshCw size={16} /> Обновить
                </button>
              </div>
              {expiresAt ? (
                <p className="presence-muted">
                  Действует до{' '}
                  {new Date(expiresAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      {history.length > 0 ? (
        <div className="presence-history">
          <h3>История начислений</h3>
          <ul>
            {history.map((h) => (
              <li key={h.id}>
                <span className={`presence-delta ${h.delta >= 0 ? 'is-plus' : 'is-minus'}`}>
                  {h.delta >= 0 ? '+' : ''}
                  {h.delta} {h.kind === 'ECO_BALL' ? POINTS.ecoBall.short : POINTS.mBall.short}
                </span>
                <span className="presence-reason">{h.reason}</span>
                <time dateTime={h.createdAt}>
                  {new Date(h.createdAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
                </time>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {fs}
    </section>
  );
}

function ScoreRing({
  title,
  kicker,
  icon,
  value,
  level,
  tone,
}: {
  title: string;
  kicker?: string;
  icon: React.ReactNode;
  value: number;
  level?: Scores['mLevel'] | null;
  tone: 'm' | 'eco';
}) {
  const pct = Math.round((level?.progress ?? 0) * 100);
  return (
    <div className={`score-ring score-ring-${tone}`}>
      <div className="score-ring-top">
        {icon}
        <strong>{title}</strong>
      </div>
      {kicker ? <p className="presence-points__kicker">{kicker}</p> : null}
      <div className="score-ring-value">{value.toLocaleString('ru-RU')}</div>
      <div className="score-ring-bar" aria-hidden>
        <span style={{ width: `${pct}%` }} />
      </div>
      <p className="score-ring-meta">
        {level?.label || 'Новичок'}
        {level?.nextLabel ? ` · до «${level.nextLabel}» ещё ${level.toNext}` : ' · максимум'}
      </p>
    </div>
  );
}
