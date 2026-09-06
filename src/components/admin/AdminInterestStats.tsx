'use client';

import { useEffect, useState } from 'react';
import PeriodPicker from '@/components/admin/PeriodPicker';
import { statsRangeQuery, type StatsRange } from '@/lib/stats-period';

type Data = Awaited<ReturnType<typeof import('@/lib/admin-insights').getInterestInsights>>;

export default function AdminInterestStats({ compact }: { compact?: boolean }) {
  const [range, setRange] = useState<StatsRange>({ period: 'week' });
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch(`/api/admin/insights?${statsRangeQuery(range)}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [range]);

  return (
    <section className="admin-interest">
      <header className="admin-interest__head">
        <div>
          <h2>Статистика интересов пользователей</h2>
          <p>Что открывают, куда записываются, какие вопросы ищут</p>
        </div>
        <PeriodPicker value={range} onChange={setRange} />
      </header>
      {!data ? (
        <p className="admin-studio-hint">Загрузка…</p>
      ) : (
        <div className={`admin-interest__grid${compact ? ' is-compact' : ''}`}>
          <div>
            <h3>Топ проектов</h3>
            <ol>
              {(data.topProjects || []).map((p) => (
                <li key={p.id}>
                  {p.title} <small>{p.viewCount} откр.</small>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Топ клубов и пространств</h3>
            <ol>
              {(data.topClubs || []).map((p) => (
                <li key={p.id}>
                  {p.title} <small>{p.viewCount}</small>
                </li>
              ))}
              {(data.topSpaces || []).map((p) => (
                <li key={p.id}>
                  {p.title} <small>{p.category}</small>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Заявки</h3>
            <ul>
              {(data.applicationsByType || []).map((a) => (
                <li key={a.type}>
                  {a.type}: {a.count}
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3>FAQ — категории</h3>
            <ol>
              {(data.faqCategories || []).map((c) => (
                <li key={c.id}>
                  {c.title} <small>{c.viewCount} · {c._count.items} вопр.</small>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Частые вопросы</h3>
            <ol>
              {(data.faqQuestions || []).map((q) => (
                <li key={q.id}>
                  {q.question} <small>{q.viewCount}</small>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Поиск FAQ</h3>
            <ol>
              {(data.faqSearches || []).map((s) => (
                <li key={s.query}>
                  «{s.query}» × {s._count._all}
                </li>
              ))}
            </ol>
            {(data.unansweredQueries || []).length ? (
              <p className="admin-studio-warn">
                Без ответа: {(data.unansweredQueries || []).map((s) => s.query).join(', ') || '—'}
              </p>
            ) : null}
          </div>
          {!compact ? (
            <div>
              <h3>Слабая вовлечённость</h3>
              <ul>
                {(data.weakProjects || []).map((p) => (
                  <li key={p.id}>{p.title}</li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      )}
    </section>
  );
}
