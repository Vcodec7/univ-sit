'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Award, Download, Eye, Sparkles } from 'lucide-react';
import { OFFICIAL_DOC_TYPE_META } from '@/lib/official-documents-shared';

type AwardItem = {
  id: string;
  type: string;
  title: string;
  subtitle?: string | null;
  serialNumber: string;
  issuedAt: string;
  occasionLabel?: string | null;
};

export default function AwardsPanel() {
  const [items, setItems] = useState<AwardItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/user/awards', { cache: 'no-store' })
      .then(async (r) => {
        const data = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(data?.error || data?.message || 'Не удалось загрузить');
        return data as { items?: AwardItem[] };
      })
      .then((data) => {
        if (!cancelled) setItems(Array.isArray(data.items) ? data.items : []);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Ошибка');
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (error) {
    return <p style={{ color: '#b91c1c' }}>{error}</p>;
  }
  if (items == null) {
    return <p style={{ color: 'var(--muted)' }}>Загрузка…</p>;
  }
  if (items.length === 0) {
    return (
      <div className="yp-award-empty">
        <div className="yp-award-empty__seal" aria-hidden>
          <Award size={28} />
        </div>
        <h2>Ваша витрина наград</h2>
        <p>
          Администрация выдаёт дипломы, сертификаты, благодарности и почётные грамоты за конкурсы,
          волонтёрство, клуб, экоакции и другие дела сообщества — как бумажные, только сразу в кабинете.
        </p>
        <div className="yp-award-actions">
          <Link href="/dashboard/achievements" className="btn btn-primary btn-sm">
            <Sparkles size={14} /> Достижения
          </Link>
          <Link href="/dashboard/portfolio" className="btn btn-secondary btn-sm">
            Портфолио
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="yp-award-grid yp-award-grid--luxe">
      {items.map((d) => (
        <article key={d.id} className="yp-award-card yp-award-card--luxe" data-type={d.type}>
          <div className="yp-award-card__foil" aria-hidden />
          <div className="yp-award-card__type">
            {(OFFICIAL_DOC_TYPE_META as Record<string, { label?: string }>)[d.type]?.label || d.type}
          </div>
          <strong>{d.title}</strong>
          {d.occasionLabel ? <em className="yp-award-card__occasion">{d.occasionLabel}</em> : null}
          <div className="yp-award-card__meta">
            {d.serialNumber} ·{' '}
            {new Date(d.issuedAt).toLocaleDateString('ru-RU', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </div>
          <div className="yp-award-actions">
            <Link href={`/awards/${d.id}`} className="btn btn-secondary btn-sm">
              <Eye size={14} /> Смотреть
            </Link>
            <a href={`/api/awards/${d.id}/pdf`} className="btn btn-primary btn-sm" target="_blank" rel="noreferrer">
              <Download size={14} /> PDF
            </a>
          </div>
        </article>
      ))}
    </div>
  );
}
