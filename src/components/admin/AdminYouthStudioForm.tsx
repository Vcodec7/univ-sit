'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoverImageField from '@/components/admin/CoverImageField';
import GalleryPickerField from '@/components/admin/GalleryPickerField';
import RichTextInput from '@/components/RichTextInput';
import AdminPlanBuilder from '@/components/admin/AdminPlanBuilder';
import {
  CATALOG_STATUSES,
  CATALOG_STATUS_RU,
  JOIN_MODES,
  YOUTH_TEMPLATES,
  parseStudioJson,
  studioChecklist,
  stripHtml,
  type JoinMode,
} from '@/lib/youth-studio';

export type StudioKind = 'project' | 'club';

type Item = {
  id?: string;
  title?: string;
  description?: string;
  template?: string;
  status?: string;
  image?: string | null;
  gallery?: string | null;
  goal?: string | null;
  mission?: string | null;
  roadmapJson?: string | null;
  rolesJson?: string | null;
  tasksJson?: string | null;
  studioJson?: string | null;
  curatorName?: string | null;
  curatorContact?: string | null;
  curatorContactPublic?: boolean | null;
  tags?: string | null;
  signupUrl?: string | null;
  meetingSchedule?: string | null;
  meetingPlace?: string | null;
};

const STEPS = [
  { id: 'main', label: 'Основное' },
  { id: 'copy', label: 'Описание' },
  { id: 'join', label: 'Участие' },
  { id: 'team', label: 'Команда' },
  { id: 'media', label: 'Медиа' },
  { id: 'publish', label: 'Публикация' },
] as const;

export default function AdminYouthStudioForm({
  kind,
  item,
  pool,
  formId,
}: {
  kind: StudioKind;
  item?: Item | null;
  pool: string[];
  formId?: string;
}) {
  const studio0 = parseStudioJson(item?.studioJson);
  if (item?.curatorName && !studio0.curatorName) studio0.curatorName = item.curatorName;
  if (item?.curatorContact && !studio0.curatorContact) studio0.curatorContact = item.curatorContact;
  if (item?.signupUrl && !studio0.signupUrl) studio0.signupUrl = item.signupUrl;
  if (item?.tags && !studio0.tags) studio0.tags = item.tags;

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(item?.title || '');
  const [status, setStatus] = useState(item?.status || 'DRAFT');
  const [template, setTemplate] = useState(item?.template || 'DEFAULT');
  const [mission, setMission] = useState(item?.mission || '');
  const [goal, setGoal] = useState(item?.goal || '');
  const [audience, setAudience] = useState(studio0.audience);
  const [whatHappens, setWhatHappens] = useState(studio0.whatHappens);
  const [howToJoin, setHowToJoin] = useState(studio0.howToJoin);
  const [joinMode, setJoinMode] = useState<JoinMode>(studio0.joinMode);
  const [format, setFormat] = useState(studio0.format || (kind === 'club' ? 'Клуб' : 'Проект'));
  const draftKey = `yp-studio-${kind}-${item?.id || 'new'}`;

  useEffect(() => {
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw || item?.id) return;
      const d = JSON.parse(raw) as { title?: string; mission?: string };
      if (d.title) setTitle(d.title);
      if (d.mission) setMission(d.mission);
    } catch {
      /* ignore */
    }
  }, [draftKey, item?.id]);

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ title, mission, goal, audience }));
      } catch {
        /* ignore */
      }
    }, 600);
    return () => window.clearTimeout(t);
  }, [draftKey, title, mission, goal, audience]);

  const applyTemplate = (key: string) => {
    const t = YOUTH_TEMPLATES[key];
    if (!t) return;
    setMission(t.why);
    setGoal(t.offer);
    setAudience(t.audience);
    setWhatHappens(t.whatHappens);
    setHowToJoin(t.howToJoin);
    setFormat(t.label);
  };

  const checklist = useMemo(
    () =>
      studioChecklist({
        title,
        description: item?.description || '',
        mission,
        goal,
        image: item?.image,
        studio: {
          audience,
          whatHappens,
          howToJoin,
          joinMode,
          curatorName: studio0.curatorName,
          curatorContact: studio0.curatorContact,
          signupUrl: studio0.signupUrl,
          tags: studio0.tags,
          format,
        },
      }),
    [title, item?.description, item?.image, mission, goal, audience, whatHappens, howToJoin, joinMode, format, studio0]
  );
  const ready = checklist.filter((c) => c.ok).length;
  const publicHref = item?.id ? `/${kind === 'club' ? 'clubs' : 'projects'}/${item.id}` : null;

  return (
    <div className="admin-studio">
      <nav className="admin-studio__steps" aria-label="Шаги">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            type="button"
            className={`admin-studio__step${i === step ? ' is-on' : ''}`}
            onClick={() => setStep(i)}
          >
            {i + 1}. {s.label}
          </button>
        ))}
      </nav>

      <section className="admin-studio__panel" hidden={step !== 0}>
          <p className="admin-studio-hint">Шаблон подставляет тексты — их можно править.</p>
          <div className="admin-studio__chips">
            {Object.entries(YOUTH_TEMPLATES).map(([k, t]) => (
              <button key={k} type="button" className="btn btn-secondary" onClick={() => applyTemplate(k)}>
                {t.label}
              </button>
            ))}
          </div>
          <label className="admin-studio__field">
            <span>
              Название <em>*</em>
            </span>
            <input name="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Например: Медиалаборатория Сочи" />
          </label>
          <label className="admin-studio__field">
            <span>Формат участия</span>
            <input name="format" value={format} onChange={(e) => setFormat(e.target.value)} placeholder="Клуб / проект / набор" />
          </label>
          <label className="admin-studio__field">
            <span>Как выглядит страница</span>
            <select name="template" value={template} onChange={(e) => setTemplate(e.target.value)}>
              <option value="DEFAULT">Текст и блоки</option>
              <option value="GALLERY">Галерея</option>
              <option value="TEAM">Команда</option>
              <option value="HERO">Крупный заголовок</option>
            </select>
          </label>
      </section>

      <section className="admin-studio__panel" hidden={step !== 1}>
          <label className="admin-studio__field">
            <span>
              Зачем идти <em>*</em>
            </span>
            <textarea name="mission" rows={2} value={mission} onChange={(e) => setMission(e.target.value)} placeholder="Одно предложение пользы" />
          </label>
          <label className="admin-studio__field">
            <span>
              Кому подойдёт <em>*</em>
            </span>
            <textarea name="audience" rows={2} value={audience} onChange={(e) => setAudience(e.target.value)} />
          </label>
          <label className="admin-studio__field">
            <span>Что будет на встречах</span>
            <textarea name="whatHappens" rows={2} value={whatHappens} onChange={(e) => setWhatHappens(e.target.value)} />
          </label>
          <label className="admin-studio__field">
            <span>
              Что получит участник <em>*</em>
            </span>
            <textarea name="goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
          </label>
          <label className="admin-studio__field">
            <span>
              Полное описание <em>*</em>
            </span>
            <RichTextInput name="description" defaultValue={item?.description || ''} />
            <small className="admin-studio-hint">Не короче 80 символов. На телефоне панель редактора прокручивается.</small>
          </label>
      </section>

      <section className="admin-studio__panel" hidden={step !== 2}>
          <fieldset className="admin-studio__join">
            <legend>Как вступить</legend>
            {JOIN_MODES.map((m) => (
              <label key={m.id} className={`admin-studio__join-opt${joinMode === m.id ? ' is-on' : ''}`}>
                <input type="radio" name="joinMode" value={m.id} checked={joinMode === m.id} onChange={() => setJoinMode(m.id)} />
                <strong>{m.label}</strong>
                <span>{m.hint}</span>
              </label>
            ))}
          </fieldset>
          <label className="admin-studio__field">
            <span>Как присоединиться (текст на странице)</span>
            <textarea name="howToJoin" rows={2} value={howToJoin} onChange={(e) => setHowToJoin(e.target.value)} />
          </label>
          <label className="admin-studio__field">
            <span>Ссылка записи</span>
            <input name="signupUrl" defaultValue={studio0.signupUrl} placeholder="https://t.me/…" />
          </label>
          {kind === 'club' ? (
            <>
              <label className="admin-studio__field">
                <span>Когда встречаемся</span>
                <input name="meetingSchedule" defaultValue={item?.meetingSchedule || ''} />
              </label>
              <label className="admin-studio__field">
                <span>Где</span>
                <input name="meetingPlace" defaultValue={item?.meetingPlace || ''} />
              </label>
            </>
          ) : null}
          <div className="admin-studio__preview-card">
            <strong>Куратор и запись</strong>
            <p>{joinMode === 'none' ? 'Кнопки записи не будет.' : JOIN_MODES.find((m) => m.id === joinMode)?.hint}</p>
          </div>
      </section>

      <section className="admin-studio__panel" hidden={step !== 3}>
          <label className="admin-studio__field">
            <span>Кто ведёт</span>
            <input name="curatorName" defaultValue={studio0.curatorName} placeholder="Имя куратора" />
          </label>
          <label className="admin-studio__field">
            <span>Контакт куратора</span>
            <input name="curatorContact" defaultValue={studio0.curatorContact} placeholder="Телефон или @ник" />
          </label>
          {kind === 'club' ? (
            <label className="admin-studio__check">
              <input type="checkbox" name="curatorContactPublic" value="true" defaultChecked={item?.curatorContactPublic !== false} />
              Показывать контакт на странице
            </label>
          ) : null}
          <label className="admin-studio__field">
            <span>Теги</span>
            <input name="tags" defaultValue={studio0.tags} placeholder="медиа, волонтёрство" />
          </label>
          <AdminPlanBuilder
            name="roadmapJson"
            title="Этапы"
            addLabel="Добавить этап"
            initialJson={item?.roadmapJson}
            fields={[
              { key: 'title', label: 'Этап' },
              { key: 'status', label: 'Статус', placeholder: 'planned / active / done' },
              { key: 'description', label: 'Что делаем' },
            ]}
          />
          <AdminPlanBuilder
            name="rolesJson"
            title="Роли"
            addLabel="Добавить роль"
            initialJson={item?.rolesJson}
            fields={[
              { key: 'role', label: 'Роль' },
              { key: 'duties', label: 'Чем занимается' },
              { key: 'name', label: 'Кто' },
            ]}
          />
          <AdminPlanBuilder
            name="tasksJson"
            title="Задачи"
            addLabel="Добавить задачу"
            initialJson={item?.tasksJson}
            fields={[
              { key: 'title', label: 'Задача' },
              { key: 'status', label: 'Статус', placeholder: 'todo / doing / done' },
              { key: 'assigneeName', label: 'Ответственный' },
            ]}
          />
      </section>

      <section className="admin-studio__panel" hidden={step !== 4}>
          <CoverImageField currentImage={item?.image} label="Обложка (16:9, лучше WebP)" />
          <GalleryPickerField name="gallery" label="Галерея" defaultValue={item?.gallery} pool={pool} />
      </section>

      <section className="admin-studio__panel" hidden={step !== 5}>
          <label className="admin-studio__field">
            <span>Статус</span>
            <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
              {CATALOG_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {CATALOG_STATUS_RU[s]}
                </option>
              ))}
            </select>
          </label>
          <div className="admin-studio__check-list">
            <p>
              Заполнено {ready} из {checklist.length}
            </p>
            <ul>
              {checklist.map((c) => (
                <li key={c.id} className={c.ok ? 'is-ok' : 'is-miss'}>
                  {c.ok ? '✓' : '!'} {c.label}
                </li>
              ))}
            </ul>
            {status === 'ACTIVE' && ready < checklist.length ? (
              <p className="admin-studio-warn">Перед публикацией лучше закрыть пункты с «!».</p>
            ) : null}
          </div>
          {item?.id ? (
            <p className="admin-studio-hint">
              Создано {item.id ? '' : ''}
              {publicHref ? (
                <Link href={publicHref} target="_blank">
                  Открыть публичную страницу
                </Link>
              ) : null}
            </p>
          ) : null}
        </section>

      <aside className="admin-studio__live" aria-live="polite">
        <div className="admin-studio__card-preview">
          <span className="admin-studio__badge">{CATALOG_STATUS_RU[status] || status}</span>
          <h3>{title || 'Без названия'}</h3>
          <p>{mission || stripHtml(item?.description || '', 120) || 'Кратко о проекте появится здесь'}</p>
          <small>{format || 'Формат'} · {JOIN_MODES.find((m) => m.id === joinMode)?.label}</small>
        </div>
      </aside>

      <div className="admin-studio__nav">
        <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Назад
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setStep((s) => Math.min(STEPS.length - 1, s + 1))}>
            Дальше
          </button>
        ) : (
          <button type="submit" form={formId} className="btn btn-primary">
            {item?.id ? 'Сохранить' : 'Создать'}
          </button>
        )}
      </div>
    </div>
  );
}
