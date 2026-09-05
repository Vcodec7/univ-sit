'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useSafeSearchParams } from '@/lib/use-safe-search-params';
import { ArrowRight, Calendar, HeartHandshake, MapPin, Wallet, Users } from 'lucide-react';
import FilterBar from '@/components/FilterBar';
import EntityCoverImage from '@/components/EntityCoverImage';
import {
  BODY_TYPE_LABELS,
  PROGRAM_KIND_META,
  formatProgramDate,
  programIsApplyOpen,
  programPublicPath,
  programStatusLabel,
  type ProgramKind,
} from '@/lib/programs-ui';
import { programCover } from '@/lib/theme-covers';

export type ProgramListItem = {
  id: string;
  kind: string;
  title: string;
  summary: string | null;
  description: string;
  image: string | null;
  status: string;
  organizer: string | null;
  place: string | null;
  amountLabel: string | null;
  bodyType: string | null;
  seats: number | null;
  startsAt: Date | string | null;
  endsAt: Date | string | null;
  _count?: { applications: number };
};

export default function ProgramCatalog({
  kind,
  items,
}: {
  kind: ProgramKind;
  items: ProgramListItem[];
}) {
  const sp = useSafeSearchParams();
  const query = (sp.get('q') || '').trim();
  const statusFilter = (sp.get('status') || 'ALL').toUpperCase();
  const filtered = useMemo(() => {
    let list = items.slice();
    if (statusFilter === 'OPEN' || statusFilter === 'CLOSED' || statusFilter === 'ARCHIVED') {
      list = list.filter((i) => i.status === statusFilter);
    }
    if (query) {
      const q = query.toLowerCase();
      list = list.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          String(i.summary || '').toLowerCase().includes(q) ||
          String(i.description || '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [items, query, statusFilter]);
  const meta = PROGRAM_KIND_META[kind];

  return (
    <div className={`container prog-hub prog-hub--${kind.toLowerCase()}`}>
      <header className="prog-hub__head">
        <div>
          {kind === 'DOBRO' ? (
            <p className="prog-hub__kicker">
              <HeartHandshake size={15} aria-hidden /> Добро.Центр Сочи
            </p>
          ) : null}
          <h1 className="text-gradient">{meta.title}</h1>
          <p>{meta.listDescription}</p>
        </div>
        <div className="prog-hub__search">
          <FilterBar placeholder={`Поиск: ${meta.title.toLowerCase()}…`} hideStatus />
        </div>
      </header>

      <div className="prog-hub__tabs">
        {[
          { id: 'ALL', label: 'Все' },
          { id: 'OPEN', label: 'Открыт набор' },
          { id: 'CLOSED', label: 'Закрытые' },
        ].map((tab) => {
          const active = (statusFilter || 'ALL') === tab.id;
          const params = new URLSearchParams();
          if (tab.id !== 'ALL') params.set('status', tab.id);
          if (query) params.set('q', query);
          const qs = params.toString();
          const href = qs ? `?${qs}` : programPublicPath(kind);
          return (
            <Link key={tab.id} href={href} className={`prog-tab${active ? ' is-on' : ''}`}>
              {tab.label}
            </Link>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="prog-empty">
          <h3>Пока пусто</h3>
          <p>
            {query
              ? 'Ничего не найдено по запросу. Попробуйте другие слова.'
              : `Скоро здесь появятся актуальные ${meta.title.toLowerCase()}. Следите за новостями.`}
          </p>
        </div>
      ) : (
        <div className="grid-cards">
          {filtered.map((item, idx) => {
            const ends = formatProgramDate(item.endsAt);
            const body = item.bodyType ? BODY_TYPE_LABELS[item.bodyType] : null;
            const open = programIsApplyOpen(item.status, item.endsAt);
            return (
              <Link
                key={item.id}
                href={programPublicPath(kind, item.id)}
                className={`catalog-card prog-card${open ? ' is-open' : ''}`}
              >
                <div className={`catalog-badge${open ? '' : ' status-completed'}`}>
                  {programStatusLabel(item.status, item.endsAt)}
                </div>
                <div className="catalog-img-wrap" style={{ position: 'relative' }}>
                  <EntityCoverImage
                    src={programCover(item, idx)}
                    alt={item.title}
                    fallback={programCover(item, idx + 5)}
                    className="catalog-img"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>
                <div className="prog-card__body">
                  <h3>{item.title}</h3>
                  <p className="line-clamp-3">
                    {item.summary || item.description.replace(/<[^>]+>/g, '')}
                  </p>
                  <div className="prog-card__meta">
                    {item.amountLabel ? (
                      <span>
                        <Wallet size={14} /> {item.amountLabel}
                      </span>
                    ) : null}
                    {ends ? (
                      <span>
                        <Calendar size={14} /> до {ends}
                      </span>
                    ) : null}
                    {item.place ? (
                      <span>
                        <MapPin size={14} /> {item.place}
                      </span>
                    ) : null}
                    {typeof item.seats === 'number' ? (
                      <span>
                        <Users size={14} /> мест: {item.seats}
                      </span>
                    ) : null}
                    {body ? <span>{body}</span> : null}
                  </div>
                  <div className="catalog-card-meta">
                    <span>{item.organizer || 'Центр развития молодежи Сочи'}</span>
                    <span className="prog-card__more">
                      Подробнее <ArrowRight size={16} />
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
