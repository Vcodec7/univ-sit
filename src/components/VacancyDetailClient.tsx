'use client';

import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import EtaCountdown from '@/components/EtaCountdown';
import toast from 'react-hot-toast';
import { sanitizeCmsHtml } from '@/lib/sanitize-html';
import { VACANCY_APP_STATUS_RU, statusRu } from '@/lib/status-labels-ru';
import {
  VACANCY_EMPLOYMENT_RU,
  VACANCY_FORMAT_RU,
  paidLabel,
  type VacancyEmployment,
} from '@/lib/vacancy-content';

type Question = {
  id: string;
  kind: string;
  prompt: string;
  optionsJson: string | null;
  weight: number;
};

type Vacancy = {
  id: string;
  title: string;
  description: string;
  workFormat: string;
  city: string | null;
  ageMin: number | null;
  ageMax: number | null;
  minReliability: number;
  minSocial: number;
  needInstructions: boolean;
  closesAt: string | null;
  seats: number | null;
  seatsTaken: number;
  applyOpen?: boolean;
  phaseLabel?: string;
  requirements: string[];
  salaryText: string | null;
  paid: boolean | null;
  employmentType: VacancyEmployment | null;
  duties: string[];
  offer: string[];
  about: string | null;
  employer: { title: string; isInternal: boolean; description: string | null };
  questions: Question[];
};

type MyApp = {
  id: string;
  status: string;
  autoScore: number | null;
  rejectReason: string | null;
  createdAt: string;
} | null;

const APP_RU = VACANCY_APP_STATUS_RU;

export default function VacancyDetailClient() {
  const { id } = useParams<{ id: string }>();
  const [vacancy, setVacancy] = useState<Vacancy | null>(null);
  const [elig, setElig] = useState<{ ok: boolean; message?: string; code?: string } | null>(null);
  const [myApp, setMyApp] = useState<MyApp>(null);
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [cover, setCover] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [needAuth, setNeedAuth] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch(`/api/vacancies/${id}`);
    const data = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setNeedAuth(true);
      return;
    }
    if (!res.ok) {
      toast.error(data.message || 'Не найдено');
      return;
    }
    setNeedAuth(false);
    setVacancy(data.vacancy);
    setElig(data.eligibility);
    setMyApp(data.myApplication || null);
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = async () => {
    setBusy(true);
    try {
      const res = await fetch('/api/vacancies/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vacancyId: id,
          coverLetter: cover,
          answers,
          website: '',
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Ошибка');
      setResult(data.message);
      toast.success(data.message);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  const withdraw = async () => {
    if (!window.confirm('Отозвать отклик?')) return;
    setBusy(true);
    try {
      const res = await fetch('/api/vacancies/apply', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ vacancyId: id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.message || 'Ошибка');
      toast.success('Отклик отозван');
      setResult(null);
      void load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setBusy(false);
    }
  };

  if (needAuth) {
    return (
      <div className="container" style={{ padding: '2rem 1rem', maxWidth: 520 }}>
        <section className="yp-surface yp-guest-gate" style={{ padding: '1.5rem', textAlign: 'center' }}>
          <h1 style={{ margin: '0 0 0.5rem', fontSize: '1.25rem' }}>Вакансия для участников</h1>
          <p style={{ margin: '0 0 1rem', color: 'var(--muted)' }}>
            Войдите, чтобы смотреть условия и откликнуться.
          </p>
          <Link href={`/login?callbackUrl=/vacancies/${encodeURIComponent(String(id || ''))}`} className="btn btn-primary">
            Войти
          </Link>
        </section>
      </div>
    );
  }

  if (!vacancy) {
    return (
      <div className="container" style={{ padding: '2rem' }}>
        Загрузка…
      </div>
    );
  }

  const activeApp =
    myApp && ['PENDING_REVIEW', 'APPROVED', 'SCREENING', 'PENDING'].includes(myApp.status) ? myApp : null;
  const rejectedApp = myApp?.status === 'REJECTED' ? myApp : null;
  const applyOpen = vacancy.applyOpen !== false;
  const canApply = Boolean(elig?.ok && !activeApp && applyOpen);
  const pay = paidLabel(vacancy.paid, vacancy.salaryText);
  const empLabel = vacancy.employmentType ? VACANCY_EMPLOYMENT_RU[vacancy.employmentType] : null;
  const seatsLeft =
    vacancy.seats != null ? Math.max(0, vacancy.seats - (vacancy.seatsTaken || 0)) : null;

  return (
    <div className="container yp-engage yp-vac" style={{ padding: '1.5rem 1rem 3rem', maxWidth: 760 }}>
      <Link href="/vacancies" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
        ← Все вакансии
      </Link>
      <header className="yp-vac__hero">
        <div>
          <p className="yp-vac__kicker">
            {empLabel || 'Вакансия'}
            {vacancy.employer.isInternal ? ' · Центр' : ''}
          </p>
          <h1 className="yp-vac__title">{vacancy.title}</h1>
          <p className="yp-vac__meta">
            {vacancy.employer.title}
            {vacancy.city ? ` · ${vacancy.city}` : ''} · {VACANCY_FORMAT_RU[vacancy.workFormat] || vacancy.workFormat}
          </p>
        </div>
        <div className="yp-vac__pay">
          {pay ? <strong>{pay}</strong> : <span>Оплата по итогам собеседования</span>}
          <em className={applyOpen ? '' : 'is-closed'}>{vacancy.phaseLabel || (applyOpen ? 'Идёт набор' : 'Набор закрыт')}</em>
        </div>
      </header>

      <ul className="yp-engage__reqs yp-vac__chips">
        {seatsLeft != null ? (
          <li className={seatsLeft === 0 ? 'is-warn' : 'is-key'}>
            {seatsLeft === 0 ? 'Мест нет' : `Осталось мест: ${seatsLeft} из ${vacancy.seats}`}
          </li>
        ) : null}
        {(vacancy.ageMin != null || vacancy.ageMax != null) && (
          <li>
            Возраст{' '}
            {vacancy.ageMin != null && vacancy.ageMax != null
              ? `${vacancy.ageMin}–${vacancy.ageMax}`
              : vacancy.ageMin != null
                ? `от ${vacancy.ageMin}`
                : `до ${vacancy.ageMax}`}
          </li>
        )}
        {vacancy.minReliability > 0 ? <li>Авторитет от {vacancy.minReliability}</li> : null}
        {vacancy.minSocial > 0 ? <li>Соцрейтинг от {vacancy.minSocial}</li> : null}
        {vacancy.needInstructions ? <li>Нужен инструктаж</li> : null}
        {vacancy.closesAt ? (
          <li className="yp-vac__eta">
            <EtaCountdown eta={vacancy.closesAt} prefix="Приём до" doneLabel="Приём закрыт" />
          </li>
        ) : null}
      </ul>

      {vacancy.about || vacancy.employer.description ? (
        <section className="card-surface yp-vac__block">
          <h2>О месте</h2>
          {vacancy.about ? <p>{vacancy.about}</p> : null}
          {vacancy.employer.description ? (
            <div
              className="prose"
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(vacancy.employer.description) }}
            />
          ) : null}
        </section>
      ) : null}

      {vacancy.duties?.length ? (
        <section className="card-surface yp-vac__block">
          <h2>Чем предстоит заниматься</h2>
          <ul>
            {vacancy.duties.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {vacancy.offer?.length ? (
        <section className="card-surface yp-vac__block">
          <h2>Что получите</h2>
          <ul>
            {vacancy.offer.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {vacancy.requirements?.length ? (
        <section className="card-surface yp-vac__block">
          <h2>Что важно</h2>
          <ul>
            {vacancy.requirements.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <div
        className="prose card-surface yp-vac__block"
        dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(vacancy.description) }}
      />

      {activeApp || result ? (
        <div className="card-surface yp-vac__block" style={{ display: 'grid', gap: '0.75rem' }}>
          <strong>
            {result || `Статус: ${statusRu(APP_RU, activeApp!.status)}`}
          </strong>
          {activeApp?.autoScore != null ? (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              Предотбор: {activeApp.autoScore}%
            </p>
          ) : null}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Link href="/dashboard/applications" className="btn btn-secondary">
              Мои заявки
            </Link>
            {activeApp && activeApp.status !== 'APPROVED' ? (
              <button type="button" className="btn btn-secondary" disabled={busy} onClick={() => void withdraw()}>
                Отозвать
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="card-surface yp-vac__block" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.1rem' }}>Отклик</h2>
          {!applyOpen ? (
            <p style={{ color: '#b45309', margin: 0 }}>{vacancy.phaseLabel || 'Набор закрыт'}</p>
          ) : null}
          {elig && !elig.ok && (
            <div>
              <p style={{ color: '#b45309', margin: '0 0 0.75rem' }}>{elig.message}</p>
              {elig.code === 'INSTRUCTIONS' ? (
                <Link href="/dashboard/guides" className="btn btn-secondary">
                  Пройти инструктаж
                </Link>
              ) : elig.code === 'AGE_UNKNOWN' ? (
                <Link href="/dashboard#profile-edit" className="btn btn-secondary">
                  Заполнить профиль
                </Link>
              ) : null}
            </div>
          )}
          {rejectedApp ? (
            <p style={{ margin: 0, color: 'var(--muted)', fontSize: '0.9rem' }}>
              Предыдущий отклик отклонён
              {rejectedApp.rejectReason ? `: ${rejectedApp.rejectReason}` : ''}. Можно подать снова.
            </p>
          ) : null}
          {canApply && (
            <>
              <label style={{ fontWeight: 600 }}>Сопроводительное (необязательно)</label>
              <textarea
                value={cover}
                onChange={(e) => setCover(e.target.value)}
                rows={3}
                placeholder="Коротко: почему вы, какой опыт, когда можете выйти"
                style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)' }}
              />
              {vacancy.questions.map((q) => {
                let options: string[] = [];
                try {
                  options = q.optionsJson ? JSON.parse(q.optionsJson) : [];
                } catch {
                  options = [];
                }
                return (
                  <div key={q.id}>
                    <label style={{ fontWeight: 600, display: 'block', marginBottom: 6 }}>{q.prompt}</label>
                    {q.kind === 'text' ? (
                      <textarea
                        rows={2}
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        style={{ width: '100%', padding: 10, borderRadius: 10, border: '1px solid rgba(15,23,42,0.12)' }}
                      />
                    ) : q.kind === 'bool' ? (
                      <select
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value === 'true' }))}
                        defaultValue=""
                        style={{ width: '100%', padding: 10, borderRadius: 10 }}
                      >
                        <option value="" disabled>
                          Выберите
                        </option>
                        <option value="true">Да</option>
                        <option value="false">Нет</option>
                      </select>
                    ) : (
                      <select
                        onChange={(e) => setAnswers((a) => ({ ...a, [q.id]: e.target.value }))}
                        defaultValue=""
                        style={{ width: '100%', padding: 10, borderRadius: 10 }}
                      >
                        <option value="" disabled>
                          Выберите
                        </option>
                        {options.map((o) => (
                          <option key={o} value={o}>
                            {o}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                );
              })}
              <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--muted)' }}>
                Вы уже в аккаунте — проверка картинками не нужна. Отклик уйдёт в кабинет заявок.
              </p>
              <button type="button" className="btn btn-primary" disabled={busy} onClick={() => void submit()}>
                {busy ? 'Отправка…' : 'Отправить отклик'}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
