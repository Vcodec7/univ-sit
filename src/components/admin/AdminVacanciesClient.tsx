'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { EMPLOYER_STATUS_RU, VACANCY_STATUS_RU, statusRu } from '@/lib/status-labels-ru';
import { parseVacancyRequirements } from '@/lib/vacancy-content';

type Employer = {
  id: string;
  title: string;
  status: string;
  isInternal: boolean;
  contactEmail: string | null;
};
type Q = {
  kind: string;
  prompt: string;
  optionsJson: string | null;
  correctJson: string | null;
  weight: number;
  knockout: boolean;
};
type Vacancy = {
  id: string;
  title: string;
  status: string;
  employerId: string;
  description: string;
  requirementsJson: string | null;
  workFormat: string;
  city: string | null;
  ageMin: number | null;
  screenPassScore: number;
  employer: { title: string };
  questions?: Q[];
  _count: { applications: number; questions: number };
};
type App = {
  id: string;
  autoScore: number | null;
  status: string;
  user: { name: string | null; email: string | null; publicCode: string | null };
  vacancy: { title: string };
};

const DEFAULT_DESC = '<p>Стажировка у партнёра Центра. React/Node, менторство, разбор реальных задач.</p>';

export default function AdminVacanciesClient() {
  const [employers, setEmployers] = useState<Employer[]>([]);
  const [vacancies, setVacancies] = useState<Vacancy[]>([]);
  const [applications, setApplications] = useState<App[]>([]);
  const [empTitle, setEmpTitle] = useState('Центр развития молодежи Сочи');
  const [empEditId, setEmpEditId] = useState<string | null>(null);
  const [vacId, setVacId] = useState<string | null>(null);
  const [vacTitle, setVacTitle] = useState('');
  const [vacEmployerId, setVacEmployerId] = useState('');
  const [vacDesc, setVacDesc] = useState(DEFAULT_DESC);
  const [vacPay, setVacPay] = useState('Стипендия 25 000 ₽ / мес');
  const [vacEmp, setVacEmp] = useState('internship');
  const [vacPaid, setVacPaid] = useState('yes');
  const [vacDuties, setVacDuties] = useState('Верстка экранов с наставником\nПравки по ревью\nУчастие в стендапах команды');
  const [vacOffer, setVacOffer] = useState('Ментор и разбор кода\nРекомендация в портфолио\nГибкий график 20 ч/нед');
  const [vacAbout, setVacAbout] = useState('IT-партнёр Центра в Сочи: продуктовая команда, гибрид с офисом у моря.');
  const [vacReqs, setVacReqs] = useState('Инструктаж в профиле\nАккаунт без блокировки\nГотовность выходить в Сочи 2 дня в неделю');
  const [vacAge, setVacAge] = useState('14');
  const [vacStatus, setVacStatus] = useState('OPEN');
  const [qPrompt, setQPrompt] = useState('Основной стек?');
  const [qCorrect, setQCorrect] = useState('Да');
  const [rejectById, setRejectById] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch('/api/admin/vacancies');
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.message || 'Нет доступа');
      return;
    }
    setEmployers(data.employers || []);
    setVacancies(data.vacancies || []);
    setApplications(data.applications || []);
    setVacEmployerId((prev) => prev || data.employers?.[0]?.id || '');
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const post = async (body: Record<string, unknown>) => {
    const res = await fetch('/api/admin/vacancies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка');
    return data;
  };

  function resetVacancyForm() {
    setVacId(null);
    setVacTitle('');
    setVacDesc(DEFAULT_DESC);
    setVacPay('Стипендия 25 000 ₽ / мес');
    setVacEmp('internship');
    setVacPaid('yes');
    setVacDuties('Верстка экранов с наставником\nПравки по ревью\nУчастие в стендапах команды');
    setVacOffer('Ментор и разбор кода\nРекомендация в портфолио\nГибкий график 20 ч/нед');
    setVacAbout('IT-партнёр Центра в Сочи: продуктовая команда, гибрид с офисом у моря.');
    setVacReqs('Инструктаж в профиле\nАккаунт без блокировки\nГотовность выходить в Сочи 2 дня в неделю');
    setVacAge('14');
    setVacStatus('OPEN');
    setQPrompt('Основной стек?');
    setQCorrect('Да');
  }

  function loadVacancy(v: Vacancy) {
    const c = parseVacancyRequirements(v.requirementsJson);
    setVacId(v.id);
    setVacTitle(v.title);
    setVacEmployerId(v.employerId);
    setVacDesc(v.description || '');
    setVacPay(c.salaryText || '');
    setVacEmp(c.employmentType || 'internship');
    setVacPaid(c.paid === null ? 'unk' : c.paid ? 'yes' : 'no');
    setVacDuties(c.duties.join('\n'));
    setVacOffer(c.offer.join('\n'));
    setVacAbout(c.about || '');
    setVacReqs(c.items.join('\n'));
    setVacAge(String(v.ageMin || 14));
    setVacStatus(v.status || 'OPEN');
    const q = v.questions?.[0];
    if (q) {
      setQPrompt(q.prompt);
      try {
        const corr = q.correctJson ? JSON.parse(q.correctJson) : '';
        setQCorrect(typeof corr === 'string' ? corr : String(corr ?? ''));
      } catch {
        setQCorrect('');
      }
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div style={{ display: 'grid', gap: '1.5rem' }}>
      <h1 style={{ margin: 0 }}>Вакансии и работодатели</h1>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Работодатели</h2>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
          <input value={empTitle} onChange={(e) => setEmpTitle(e.target.value)} style={{ flex: 1, minWidth: 200, padding: 8 }} />
          <button
            type="button"
            className="btn btn-primary"
            onClick={() =>
              void post({
                action: 'upsertEmployer',
                id: empEditId || undefined,
                title: empTitle,
                isInternal: true,
                status: 'APPROVED',
              })
                .then(() => {
                  toast.success(empEditId ? 'Работодатель обновлён' : 'Сохранено');
                  setEmpEditId(null);
                  void load();
                })
                .catch((e) => toast.error(e.message))
            }
          >
            {empEditId ? 'Сохранить работодателя' : 'Создать / центр'}
          </button>
          {empEditId ? (
            <button type="button" className="btn btn-secondary" onClick={() => setEmpEditId(null)}>
              Отмена
            </button>
          ) : null}
        </div>
        <ul>
          {employers.map((e) => (
            <li key={e.id} style={{ marginBottom: 8 }}>
              {e.title} · {statusRu(EMPLOYER_STATUS_RU, e.status)}
              {e.isInternal ? ' · внутренний' : ''}
              {' '}
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setEmpEditId(e.id);
                  setEmpTitle(e.title);
                }}
              >
                Править
              </button>
              {e.status === 'PENDING' && (
                <>
                  {' '}
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() =>
                      void post({ action: 'setEmployerStatus', id: e.id, status: 'APPROVED' }).then(() => {
                        toast.success('Одобрен');
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
                      void post({ action: 'setEmployerStatus', id: e.id, status: 'REJECTED' }).then(() => {
                        void load();
                      })
                    }
                  >
                    Отклонить
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>{vacId ? 'Редактировать вакансию' : 'Новая вакансия'}</h2>
        <div style={{ display: 'grid', gap: 8 }}>
          <select value={vacEmployerId} onChange={(e) => setVacEmployerId(e.target.value)}>
            {employers
              .filter((e) => e.status === 'APPROVED')
              .map((e) => (
                <option key={e.id} value={e.id}>
                  {e.title}
                </option>
              ))}
          </select>
          <input placeholder="Название" value={vacTitle} onChange={(e) => setVacTitle(e.target.value)} />
          <textarea rows={3} value={vacDesc} onChange={(e) => setVacDesc(e.target.value)} />
          <input placeholder="Оплата / стипендия" value={vacPay} onChange={(e) => setVacPay(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <select value={vacEmp} onChange={(e) => setVacEmp(e.target.value)}>
              <option value="internship">Стажировка</option>
              <option value="part_time">Подработка</option>
              <option value="full_time">Полная занятость</option>
              <option value="project">Проект / смена</option>
              <option value="volunteer">Волонтёрство</option>
            </select>
            <select value={vacPaid} onChange={(e) => setVacPaid(e.target.value)} aria-label="Оплата">
              <option value="yes">Оплачивается</option>
              <option value="no">Без оплаты</option>
              <option value="unk">Не указано</option>
            </select>
            <select value={vacStatus} onChange={(e) => setVacStatus(e.target.value)} aria-label="Статус">
              <option value="OPEN">Набор открыт</option>
              <option value="CLOSED">Закрыта</option>
              <option value="DRAFT">Черновик</option>
              <option value="ARCHIVED">Архив</option>
            </select>
            <input
              type="number"
              min={14}
              max={35}
              value={vacAge}
              onChange={(e) => setVacAge(e.target.value)}
              aria-label="Возраст от"
              style={{ width: 96 }}
            />
          </div>
          <textarea rows={2} placeholder="О работодателе" value={vacAbout} onChange={(e) => setVacAbout(e.target.value)} />
          <textarea rows={3} placeholder="Чем заниматься (по строке)" value={vacDuties} onChange={(e) => setVacDuties(e.target.value)} />
          <textarea rows={3} placeholder="Что получите (по строке)" value={vacOffer} onChange={(e) => setVacOffer(e.target.value)} />
          <textarea rows={3} placeholder="Что важно (по строке)" value={vacReqs} onChange={(e) => setVacReqs(e.target.value)} />
          <input placeholder="Вопрос скрининга" value={qPrompt} onChange={(e) => setQPrompt(e.target.value)} />
          <input placeholder="Правильный ответ" value={qCorrect} onChange={(e) => setQCorrect(e.target.value)} />
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() =>
                void post({
                  action: 'upsertVacancy',
                  id: vacId || undefined,
                  employerId: vacEmployerId,
                  title: vacTitle,
                  description: vacDesc,
                  status: vacStatus,
                  workFormat: 'hybrid',
                  city: 'Сочи',
                  ageMin: Number(vacAge) || 14,
                  needInstructions: true,
                  screenPassScore: 70,
                  salaryText: vacPay,
                  paid: vacPaid === 'unk' ? null : vacPaid === 'yes',
                  employmentType: vacEmp,
                  about: vacAbout,
                  duties: vacDuties.split('\n').map((s) => s.trim()).filter(Boolean),
                  offer: vacOffer.split('\n').map((s) => s.trim()).filter(Boolean),
                  requirements: vacReqs.split('\n').map((s) => s.trim()).filter(Boolean),
                  questions: qPrompt.trim()
                    ? [
                        {
                          kind: 'single',
                          prompt: qPrompt,
                          options: ['React', 'Node', 'Другое'],
                          correct: qCorrect,
                          weight: 1,
                          knockout: false,
                        },
                      ]
                    : undefined,
                })
                  .then(() => {
                    toast.success(vacId ? 'Вакансия сохранена' : 'Вакансия опубликована');
                    resetVacancyForm();
                    void load();
                  })
                  .catch((e) => toast.error(e.message))
              }
            >
              {vacId ? 'Сохранить изменения' : 'Опубликовать'}
            </button>
            {vacId ? (
              <button type="button" className="btn btn-secondary" onClick={resetVacancyForm}>
                Новая вакансия
              </button>
            ) : null}
          </div>
        </div>
        <ul style={{ marginTop: 12 }}>
          {vacancies.map((v) => (
            <li key={v.id} style={{ marginBottom: 8 }}>
              {v.title} · {statusRu(VACANCY_STATUS_RU, v.status)} · {v.employer.title} · откликов {v._count.applications}
              {' '}
              <button type="button" className="btn btn-secondary" onClick={() => loadVacancy(v)}>
                Править
              </button>
            </li>
          ))}
        </ul>
      </section>

      <section className="card-surface" style={{ padding: '1rem' }}>
        <h2 style={{ fontSize: '1.1rem' }}>Отклики на разбор</h2>
        {applications.length === 0 ? (
          <p style={{ color: 'var(--muted)' }}>Нет заявок на рассмотрении</p>
        ) : (
          <ul>
            {applications.map((a) => (
              <li key={a.id} style={{ marginBottom: 10 }}>
                {a.user.name} ({a.user.email}) → {a.vacancy.title} · балл {a.autoScore}%
                <div style={{ display: 'grid', gap: 8, marginTop: 4, maxWidth: 480 }}>
                  <input
                    placeholder="Причина отказа (увидит кандидат)"
                    value={rejectById[a.id] || ''}
                    onChange={(e) => setRejectById((m) => ({ ...m, [a.id]: e.target.value }))}
                  />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() =>
                        void post({ action: 'reviewApplication', id: a.id, status: 'APPROVED' }).then(() => {
                          toast.success('Одобрено');
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
                          action: 'reviewApplication',
                          id: a.id,
                          status: 'REJECTED',
                          rejectReason: (rejectById[a.id] || '').trim() || 'Пока другое решение по этой вакансии',
                        }).then(() => {
                          toast.success('Отклонено');
                          void load();
                        })
                      }
                    >
                      Отклонить
                    </button>
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
