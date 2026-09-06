'use client';

import { useEffect, useState } from 'react';
import PeriodPicker from '@/components/admin/PeriodPicker';
import { statsRangeQuery, type StatsRange } from '@/lib/stats-period';

type Data = Awaited<ReturnType<typeof import('@/lib/admin-insights').getInterestInsights>>;

export default function AdminInterestStats({ compact, faqOnly }: { compact?: boolean; faqOnly?: boolean }) {
  const [range, setRange] = useState<StatsRange>({ period: 'week' });
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    fetch(`/api/admin/insights?${statsRangeQuery(range)}`, { credentials: 'same-origin' })
      .then((r) => r.json())
      .then((d) => {
        if (!d || (d.message && !d.faqCategories && !d.topProjects)) {
          setData({
            topProjects: [],
            topClubs: [],
            topSpaces: [],
            applicationsByType: [],
            faqSearches: [],
            faqCategories: [],
            faqQuestions: [],
            weakProjects: [],
            unansweredQueries: [],
          } as Data);
          return;
        }
        setData(d);
      })
      .catch(() => setData(null));
  }, [range]);

  const periods: Array<StatsRange['period']> = ['day', 'week', 'month'];

  return (
    <section className="admin-interest" aria-labelledby="interest-title">
      <header className="admin-interest__head">
        <div>
          <h2 id="interest-title">Статистика интересов пользователей</h2>
          <p>Какие темы открывают чаще, какие вопросы читают и что ищут без ответа</p>
        </div>
        {faqOnly ? (
          <div className="admin-interest__periods" role="group" aria-label="Период">
            {periods.map((p) => (
              <button
                key={p}
                type="button"
                className={`btn ${range.period === p ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setRange({ period: p })}
              >
                {p === 'day' ? 'День' : p === 'week' ? 'Неделя' : 'Месяц'}
              </button>
            ))}
          </div>
        ) : (
          <PeriodPicker value={range} onChange={setRange} />
        )}
      </header>
      {!data ? (
        <p className="admin-studio-hint">Загрузка…</p>
      ) : (
        <div className={`admin-interest__grid${compact ? ' is-compact' : ''}`}>
          <div>
            <h3>Топ популярных категорий</h3>
            <ol>
              {(data.faqCategories || []).length === 0 ? <li>Пока нет просмотров</li> : null}
              {(data.faqCategories || []).map((c) => (
                <li key={c.id}>
                  {c.title} <small>{c.viewCount} просм. · {c._count.items} вопр.</small>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Топ популярных вопросов</h3>
            <ol>
              {(data.faqQuestions || []).length === 0 ? <li>Пока нет переходов</li> : null}
              {(data.faqQuestions || []).map((q) => (
                <li key={q.id}>
                  {q.question} <small>{q.viewCount} просм.</small>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Поисковые запросы</h3>
            <ol>
              {(data.faqSearches || []).length === 0 ? <li>Запросов за период нет</li> : null}
              {(data.faqSearches || []).map((s) => (
                <li key={s.query}>
                  «{s.query}» × {s._count._all}
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3>Не нашли ответа</h3>
            {(data.unansweredQueries || []).length === 0 ? (
              <p className="admin-studio-hint">Пустых поисков нет</p>
            ) : (
              <ul>
                {(data.unansweredQueries || []).map((s) => (
                  <li key={s.query}>«{s.query}»</li>
                ))}
              </ul>
            )}
          </div>
          {!faqOnly ? (
            <>
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
            </>
          ) : null}
        </div>
      )}
    </section>
  );
}
