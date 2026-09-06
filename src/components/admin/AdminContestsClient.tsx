'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CONTEST_KIND_RU, CONTEST_STATUS_RU } from '@/lib/contest-eligibility-shared';

type Contest = {
  id: string;
  kind: string;
  title: string;
  status: string;
  summary: string | null;
  rulesHtml: string;
  prizeText: string | null;
  bookingId: string | null;
  booking: { title: string } | null;
  _count: { submissions: number; raffleEntries: number; winners: number };
};
type Sub = {
  id: string;
  title: string | null;
  status: string;
  user: { name: string | null; publicCode: string | null };
  contest: { title: string };
};

export default function AdminContestsClient() {
  const [contests, setContests] = useState<Contest[]>([]);
  const [pending, setPending] = useState<Sub[]>([]);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [kind, setKind] = useState('SUBMISSION');
  const [status, setStatus] = useState('OPEN');
  const [summary, setSummary] = useState('');
  const [rulesHtml, setRulesHtml] = useState('<p>Правила конкурса</p>');
  const [prizeText, setPrizeText] = useState('Приз от Центра');
  const [bookingId, setBookingId] = useState('');
  const [awardContestId, setAwardContestId] = useState('');
  const [awardCode, setAwardCode] = useState('');
  const [awardAmount, setAwardAmount] = useState(25);
  const [awardReason, setAwardReason] = useState('');
  const [rejectById, setRejectById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/contests');
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Нет доступа');
      return;
    }
    setContests(data.contests || []);
    setPending(data.pendingSubs || []);
    setAwardContestId((prev) => prev || data.contests?.[0]?.id || '');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/contests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка');
    return data;
  };

  function resetForm() {
    setEditId(null);
    setTitle('');
    setKind('SUBMISSION');
    setStatus('OPEN');
    setSummary('');
    setRulesHtml('<p>Правила конкурса</p>');
    setPrizeText('Приз от Центра');
    setBookingId('');
  }

  function loadContest(c: Contest) {
    setEditId(c.id);
    setTitle(c.title);
    setKind(c.kind);
    setStatus(c.status);
    setSummary(c.summary || '');
    setRulesHtml(c.rulesHtml || '<p></p>');
    setPrizeText(c.prizeText || '');
    setBookingId(c.bookingId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ display: 'grid', gap: '1.25rem' }}>
      <h1 style={{ margin: 0 }}>Конкурсы и розыгрыши</h1>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>{editId ? 'Редактировать' : 'Создать'}</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={Boolean(editId)}>
            <option value="SUBMISSION">Конкурс работ</option>
            <option value="RAFFLE">Розыгрыш</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
            <option value="OPEN">Открыт</option>
            <option value="DRAFT">Черновик</option>
            <option value="CLOSED">Закрыт</option>
          </select>
          <input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          <input placeholder="Кратко" value={summary} onChange={(e) => setSummary(e.target.value)} />
          <textarea rows={4} placeholder="Правила (HTML)" value={rulesHtml} onChange={(e) => setRulesHtml(e.target.value)} />
          <input placeholder="Приз" value={prizeText} onChange={(e) => setPrizeText(e.target.value)} />
          {kind === 'RAFFLE' && (
            <input
              placeholder="bookingId события (афиша)"
              value={bookingId}
              onChange={(e) => setBookingId(e.target.value)}
            />
          )}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                void post({
                  action: 'upsertContest',
                  id: editId || undefined,
                  kind,
                  title,
                  summary: summary || null,
                  rulesHtml,
                  status,
                  allowVoting: true,
                  bookingId: kind === 'RAFFLE' ? bookingId || null : null,
                  prizeText,
                })
                  .then(() => {
                    toast.success(editId ? 'Сохранено' : 'Создано');
                    resetForm();
                    void load();
                  })
                  .catch((e) => toast.error(e.message))
              }
            >
              {editId ? 'Сохранить' : 'Опубликовать'}
            </button>
            {editId ? (
              <button type="button" className="btn btn-secondary" onClick={resetForm}>
                Новый конкурс
              </button>
            ) : null}
          </div>
        </div>
      </section>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Наградить мбаллами</h2>
        <p style={{ margin: '0 0 8px', fontSize: '0.85rem', color: 'var(--muted)' }}>
          Ручная награда участнику (учитывается общий пул). Авто-начисления при одобрении/победе
          уже работают.
        </p>
        <div style={{ display: 'grid', gap: 8, maxWidth: 520 }}>
          <select value={awardContestId} onChange={(e) => setAwardContestId(e.target.value)}>
            <option value="">Конкурс…</option>
            {contests.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title}
              </option>
            ))}
          </select>
          <input
            placeholder="Код профиля (YM-…)"
            value={awardCode}
            onChange={(e) => setAwardCode(e.target.value)}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 8 }}>
            <input
              type="number"
              min={1}
              max={5000}
              value={awardAmount}
              onChange={(e) => setAwardAmount(Number(e.target.value) || 1)}
            />
            <input
              placeholder="Причина (необязательно)"
              value={awardReason}
              onChange={(e) => setAwardReason(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn btn-primary"
            disabled={!awardContestId || !awardCode.trim()}
            onClick={() =>
              void post({
                action: 'awardEco',
                contestId: awardContestId,
                publicCode: awardCode.trim(),
                amount: awardAmount,
                reason: awardReason.trim() || 'contest_manual_award',
              })
                .then((r) => {
                  toast.success(`Начислено. Баланс: ${r.ecoPoints}`);
                  setAwardCode('');
                })
                .catch((e) => toast.error(e.message))
            }
          >
            Выдать мбаллы
          </button>
        </div>
      </section>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Список</h2>
        <ul style={{ margin: 0, paddingLeft: '1.1rem' }}>
          {contests.map((c) => (
            <li key={c.id} style={{ marginBottom: 12 }}>
              <strong>{c.title}</strong> · {CONTEST_KIND_RU[c.kind] || c.kind} · {CONTEST_STATUS_RU[c.status] || "Неизвестно"}
              {c.booking ? ` · ${c.booking.title}` : ''}
              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                работ {c._count.submissions} · пул {c._count.raffleEntries} · победителей{' '}
                {c._count.winners}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 6 }}>
                <button type="button" className="btn btn-secondary" onClick={() => loadContest(c)}>
                  Править
                </button>
                {c.kind === 'RAFFLE' && (
                  <>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        void post({ action: 'syncRaffle', contestId: c.id })
                          .then((r) => {
                            toast.success(`Синхронизировано: ${r.synced}`);
                            void load();
                          })
                          .catch((e) => toast.error(e.message))
                      }
                    >
                      Синхронизировать отметки
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        void post({ action: 'drawRaffle', contestId: c.id })
                          .then((r) => {
                            toast.success(`Розыгрыш: seed ${String(r.seed).slice(0, 12)}…`);
                            void load();
                          })
                          .catch((e) => toast.error(e.message))
                      }
                    >
                      Провести розыгрыш
                    </button>
                  </>
                )}
                {c.kind === 'SUBMISSION' && (
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      void post({ action: 'declareSubmissionWinners', contestId: c.id, count: 3 })
                        .then(() => {
                          toast.success('Победители по голосам');
                          void load();
                        })
                        .catch((e) => toast.error(e.message))
                    }
                  >
                    Топ-3 по голосам
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.05rem', marginTop: 0 }}>Модерация работ</h2>
        {pending.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Нет работ на проверке</p>
        ) : (
          <ul>
            {pending.map((s) => (
              <li key={s.id} style={{ marginBottom: 10 }}>
                {s.user.name}
                {s.user.publicCode ? ` (${s.user.publicCode})` : ''} → {s.contest.title}:{' '}
                {s.title || 'без названия'}
                <div style={{ display: 'grid', gap: 8, marginTop: 4, maxWidth: 480 }}>
                  <input
                    placeholder="Причина отказа"
                    value={rejectById[s.id] || ''}
                    onChange={(e) => setRejectById((m) => ({ ...m, [s.id]: e.target.value }))}
                  />
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        void post({ action: 'reviewSubmission', id: s.id, status: 'APPROVED' }).then(
                          () => {
                            toast.success('Одобрено (+М-баллы)');
                            void load();
                          }
                        )
                      }
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() =>
                        void post({
                          action: 'reviewSubmission',
                          id: s.id,
                          status: 'REJECTED',
                          rejectReason: (rejectById[s.id] || '').trim() || undefined,
                        }).then(() => {
                          toast.success('Отклонено');
                          void load();
                        })
                      }
                    >
                      Отклонить
                    </button>
                    {s.user.publicCode ? (
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => {
                          setAwardContestId(
                            contests.find((c) => c.title === s.contest.title)?.id || awardContestId
                          );
                          setAwardCode(s.user.publicCode || '');
                          toast.success('Код подставлен в форму награды');
                        }}
                      >
                        В награду
                      </button>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
