import Link from 'next/link';
import { ArrowRight, ExternalLink, MapPin, Phone, Send, Users } from 'lucide-react';
import {
  afishaItemHref,
  parseAfishaWeekJson,
  type AfishaWeekItem,
} from '@/lib/afisha-week';
import { afishaItemCover } from '@/lib/theme-covers';

type Props = {
  enabled: boolean;
  json?: string | null;
  /** Show compact home layout vs full /events page vs embed (grid only) */
  layout?: 'home' | 'page' | 'embed';
};

function ActionIcon({ action }: { action: AfishaWeekItem['action'] }) {
  if (action === 'phone') return <Phone size={16} />;
  if (action === 'telegram') return <Send size={16} />;
  return <ExternalLink size={16} />;
}

function ctaLabel(item: AfishaWeekItem): string {
  if (item.label) return item.label;
  if (item.action === 'phone') return 'Позвонить';
  if (item.action === 'telegram') return 'Записаться';
  if (item.action === 'link') return 'Открыть';
  return 'Подробнее';
}

function actionChip(item: AfishaWeekItem): string {
  if (item.action === 'phone') return 'Телефон';
  if (item.action === 'telegram') return 'Telegram';
  if (item.action === 'link') return 'Анкета';
  return 'Запись';
}

function ItemCard({ item, index }: { item: AfishaWeekItem; index: number }) {
  const href = afishaItemHref(item);
  const label = ctaLabel(item);
  const cover = afishaItemCover(item, index);

  return (
    <article className="catalog-card afisha-card" style={{ position: 'relative' }}>
      {href ? (
        <a
          href={href}
          aria-label={`${item.title} — ${label}`}
          target={item.action === 'phone' ? undefined : '_blank'}
          rel={item.action === 'phone' ? undefined : 'noopener noreferrer'}
          style={{ position: 'absolute', inset: 0, zIndex: 1 }}
        />
      ) : null}

      <div className="catalog-badge">Открыто</div>

      <div className="catalog-img-wrap" style={{ position: 'relative' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={cover} alt="" className="catalog-img" />
      </div>

      <div
        style={{
          padding: '1.25rem 1.25rem 1rem',
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          gap: '0.75rem',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', position: 'relative', zIndex: 2 }}>
          <span
            style={{
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.55rem',
              borderRadius: 999,
              background: 'rgba(59,130,246,0.1)',
              color: 'var(--primary)',
            }}
          >
            {actionChip(item)}
          </span>
        </div>

        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.3, color: 'var(--foreground)', margin: 0 }}>
          {item.title}
        </h3>

        {item.place ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.5rem',
              color: 'var(--muted)',
              fontSize: '0.9rem',
            }}
          >
            <MapPin size={16} style={{ marginTop: 2, flexShrink: 0, color: 'var(--accent)' }} />
            <span>{item.place}</span>
          </div>
        ) : null}

        {item.note ? (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.5 }}>{item.note}</p>
        ) : (
          <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.92rem', lineHeight: 1.5, flexGrow: 1 }}>
            Запишитесь удобным способом — телефон, Telegram или анкета.
          </p>
        )}

        <div className="catalog-card-meta">
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--muted)',
              fontSize: '0.9rem',
              fontWeight: 500,
            }}
          >
            <Users size={16} />
            Набор открыт
          </span>
          <span
            style={{
              color: 'var(--accent)',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              fontSize: '0.95rem',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {href ? (
              <a
                href={href}
                target={item.action === 'phone' ? undefined : '_blank'}
                rel={item.action === 'phone' ? undefined : 'noopener noreferrer'}
                style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}
              >
                {label} <ArrowRight size={16} />
              </a>
            ) : (
              <>
                {label} <ArrowRight size={16} />
              </>
            )}
          </span>
        </div>
      </div>
    </article>
  );
}

export default function WeeklyAfisha({ enabled, json, layout = 'home' }: Props) {
  if (!enabled) return null;
  const cfg = parseAfishaWeekJson(json);
  if (!cfg.items.length) return null;

  const grid = (
    <div className="grid-cards afisha-cards">
      {cfg.items.map((item, i) => (
        <ItemCard key={item.id} item={item} index={i} />
      ))}
    </div>
  );

  if (layout === 'embed') {
    return (
      <div className="afisha-week afisha-week--embed" aria-label={cfg.title}>
        {grid}
      </div>
    );
  }

  if (layout === 'page') {
    return (
      <section className="afisha-week afisha-week--page afisha-week--cards" aria-label={cfg.title}>
        <div className="home-section-head">
          <div>
            <h1 className="home-section-title">{cfg.title}</h1>
            <p className="home-section-sub">Запись на занятия и клубы на эту неделю</p>
          </div>
          <Link href="/events" className="home-section-link">
            Вся афиша <ArrowRight size={18} />
          </Link>
        </div>
        <div className="afisha-panel afisha-panel--page afisha-panel--cards">{grid}</div>
      </section>
    );
  }

  return (
    <section className="home-section afisha-week afisha-week--cards" aria-label={cfg.title}>
      <div className="home-section-head">
        <div>
          <h2 className="home-section-title">{cfg.title}</h2>
          <p className="home-section-sub">Запись на занятия и клубы на эту неделю</p>
        </div>
        <Link href="/events" className="home-section-link">
          Вся афиша <ArrowRight size={18} />
        </Link>
      </div>
      <div className="afisha-panel afisha-panel--cards">{grid}</div>
    </section>
  );
}
