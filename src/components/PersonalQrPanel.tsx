'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import QRCodeDisplay from '@/components/QRCodeDisplay';
import { Maximize2, RefreshCw, Wallet } from 'lucide-react';

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

export default function PersonalQrPanel() {
  const [url, setUrl] = useState('');
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [scores, setScores] = useState<Scores | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [fullscreen, setFullscreen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQr, setShowQr] = useState(false);

  const load = useCallback(async (force = false) => {
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

  useEffect(() => {
    const t = window.setTimeout(() => setShowQr(true), 120);
    return () => window.clearTimeout(t);
  }, []);

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

  const qrSize = mounted && window.matchMedia('(max-width: 700px)').matches ? 148 : 188;
  const reputation = scores?.mBall ?? 0;
  const wallet = scores?.ecoPoints ?? 0;
  const level = scores?.mLevel;

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
              <QRCodeDisplay value={url} size={Math.min(360, Math.floor(window.innerWidth * 0.72))} />
              <p>Покажите на входе</p>
            </div>
          </div>,
          document.body
        )
      : null;

  return (
    <section className="presence-panel yp-pass-block" aria-label="Пропуск и счета">
      <div className="yp-accounts" aria-label="Счета">
        <div className="yp-accounts__row">
          <div>
            <p className="yp-accounts__label">Репутация</p>
            <p className="yp-accounts__hint">
              {level?.label || 'Новичок'}
              {level?.nextLabel ? ` · ещё ${level.toNext} до «${level.nextLabel}»` : ''}
            </p>
          </div>
          <strong className="yp-accounts__value">{reputation.toLocaleString('ru-RU')}</strong>
        </div>
        <Link href="/dashboard/shop" className="yp-accounts__row yp-accounts__row--link">
          <div>
            <p className="yp-accounts__label">
              <Wallet size={14} aria-hidden /> Кошелёк магазина
            </p>
            <p className="yp-accounts__hint">Эко-очки: тратятся на рамки и оформление</p>
          </div>
          <strong className="yp-accounts__value">{wallet.toLocaleString('ru-RU')}</strong>
        </Link>
      </div>

      <div className="presence-qr-card">
        <div className="presence-qr-head">
          <h2>Пропуск</h2>
          <p>QR на входе, обновляется раз в сутки</p>
        </div>
        {loading && !url ? <p className="presence-muted">Готовим QR…</p> : null}
        {error ? <p className="presence-error">{error}</p> : null}
        {url && showQr ? (
          <div className="presence-qr-wrap">
            <QRCodeDisplay value={url} size={qrSize} />
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
                до {new Date(expiresAt).toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' })}
              </p>
            ) : null}
          </div>
        ) : url ? (
          <p className="presence-muted">QR…</p>
        ) : null}
      </div>

      {history.length > 0 ? (
        <div className="presence-history">
          <h3>История</h3>
          <ul>
            {history.slice(0, 5).map((h) => (
              <li key={h.id}>
                <span className={`presence-delta ${h.delta >= 0 ? 'is-plus' : 'is-minus'}`}>
                  {h.delta >= 0 ? '+' : ''}
                  {h.delta} {h.kind === 'ECO_POINTS' || h.kind === 'ECO' ? 'кошелёк' : 'репутация'}
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
