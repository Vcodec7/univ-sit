'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { CONTEST_KIND_RU, CONTEST_STATUS_RU } from '@/lib/contest-eligibility-shared';
import { vacancyHtmlToPlain, vacancyPlainToHtml } from '@/lib/vacancy-content';

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
  const [rulesHtml, setRulesHtml] = useState('Правила конкурса');
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
    setRulesHtml('Правила конкурса');
    setPrizeText('Приз от Центра');
    setBookingId('');
  }

  function loadContest(c: Contest) {
    setEditId(c.id);
    setTitle(c.title);
    setKind(c.kind);
    setStatus(c.status);
    setSummary(c.summary || '');
    setRulesHtml(vacancyHtmlToPlain(c.rulesHtml || ''));
    setPrizeText(c.prizeText || '');
    setBookingId(c.bookingId || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="admin-page-shell admin-vac-page">
      <div className="admin-page-header">
        <div>
          <h1>Конкурсы</h1>
          <p>Работы, розыгрыши, М-баллы</p>
        </div>
      </div>

      <section className="card-surface admin-vac-card">
        <h2>{editId ? 'Редактировать' : 'Создать'}</h2>
        <div className="admin-vac-form">
          <div className="admin-vac-form__row">
            <select value={kind} onChange={(e) => setKind(e.target.value)} disabled={Boolean(editId)} aria-label="Тип">
              <option value="SUBMISSION">Конкурс работ</option>
              <option value="RAFFLE">Розыгрыш</option>
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Статус">
              <option value="OPEN">Открыт</option>
              <option value="DRAFT">Черновик</option>
              <option value="CLOSED">Закрыт</option>
            </select>
          </div>
          <label>
            Название
            <input placeholder="Название" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label>
            Кратко
            <input placeholder="Кратко" value={summary} onChange={(e) => setSummary(e.target.value)} />
          </label>
          <label>
            Правила
            <textarea rows={4} placeholder="Текст правил без HTML" value={rulesHtml} onChange={(e) => setRulesHtml(e.target.value)} />
          </label>
          <label>
            Приз
            <input placeholder="Приз" value={prizeText} onChange={(e) => setPrizeText(e.target.value)} />
          </label>
          {kind === 'RAFFLE' ? (
            <label>
              Событие афиши
              <input
                placeholder="ID брони события"
                value={bookingId}
                onChange={(e) => setBookingId(e.target.value)}
              />
            </label>
          ) : null}
          <div className="admin-entity-list__actions">
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
                  rulesHtml: vacancyPlainToHtml(rulesHtml),
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

      <section className="card-surface admin-vac-card">
        <h2>Наградить М-баллами</h2>
        <p className="admin-empty" style={{ marginBottom: '0.55rem' }}>
          Ручная награда (общий пул). Авто-начисления при одобрении и победе уже работают.
        </p>
        <div className="admin-vac-form">
          <label>
            Конкурс
            <select value={awardContestId} onChange={(e) => setAwardContestId(e.target.value)}>
              <option value="">Выберите конкурс</option>
              {contests.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            Код профиля
            <input placeholder="YM-…" value={awardCode} onChange={(e) => setAwardCode(e.target.value)} />
          </label>
          <div className="admin-vac-form__row">
            <input
              type="number"
              min={1}
              max={5000}
              value={awardAmount}
              onChange={(e) => setAwardAmount(Number(e.target.value) || 1)}
              aria-label="Сумма М-баллов"
            />
            <input placeholder="Причина" value={awardReason} onChange={(e) => setAwardReason(e.target.value)} />
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
            Выдать М-баллы
          </button>
        </div>
      </section>

      <section className="card-surface admin-vac-card">
        <h2>Список</h2>
        <ul className="admin-entity-list">
          {contests.map((c) => (
            <li key={c.id} className="is-stack">
              <div className="admin-entity-list__copy">
                <strong>{c.title}</strong>
                <span>
                  {CONTEST_KIND_RU[c.kind] || c.kind} · {CONTEST_STATUS_RU[c.status] || 'Неизвестно'}
                  {c.booking ? ` · ${c.booking.title}` : ''}
                </span>
                <span>
                  работ {c._count.submissions} · пул {c._count.raffleEntries} · победителей {c._count.winners}
                </span>
              </div>
              <div className="admin-entity-list__actions">
                <button type="button" className="btn btn-secondary" onClick={() => loadContest(c)}>
                  Править
                </button>
                {c.kind === 'RAFFLE' ? (
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
                      Синхр. отметки
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
                      Розыгрыш
                    </button>
                  </>
                ) : null}
                {c.kind === 'SUBMISSION' ? (
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
                    Топ-3
                  </button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface admin-vac-card">
        <h2>Модерация работ</h2>
        {pending.length === 0 ? (
          <p className="admin-empty">Нет работ на проверке</p>
        ) : (
          <ul className="admin-entity-list">
            {pending.map((s) => (
              <li key={s.id} className="is-stack">
                <div className="admin-entity-list__copy">
                  <strong>{s.user.name}</strong>
                  <span>
                    {s.user.publicCode ? `${s.user.publicCode} · ` : ''}
                    {s.contest.title}: {s.title || 'без названия'}
                  </span>
                </div>
                <input
                  className="settings-input"
                  placeholder="Причина отказа"
                  value={rejectById[s.id] || ''}
                  onChange={(e) => setRejectById((m) => ({ ...m, [s.id]: e.target.value }))}
                />
                <div className="admin-entity-list__actions">
                  <button
                    type="button"
                    className="btn btn-primary"
                    onClick={() =>
                      void post({ action: 'reviewSubmission', id: s.id, status: 'APPROVED' }).then(() => {
                        toast.success('Одобрено (+М-баллы)');
                        void load();
                      })
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
                        setAwardContestId(contests.find((c) => c.title === s.contest.title)?.id || awardContestId);
                        setAwardCode(s.user.publicCode || '');
                        toast.success('Код подставлен в форму награды');
                      }}
                    >
                      В награду
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
