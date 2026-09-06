'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoverImageField from '@/components/admin/CoverImageField';
import GalleryPickerField from '@/components/admin/GalleryPickerField';
import RichTextInput from '@/components/RichTextInput';
import AdminPlanBuilder from '@/components/admin/AdminPlanBuilder';
import SpaceAmenitiesField from '@/components/admin/SpaceAmenitiesField';
import {
  CATALOG_STATUSES,
  CATALOG_STATUS_RU,
  JOIN_MODES,
  PAGE_STATUSES,
  PAGE_STATUS_RU,
  YOUTH_TEMPLATES,
  parseStudioJson,
  studioChecklist,
  stripHtml,
  type JoinMode,
} from '@/lib/youth-studio';
import { SPACE_CATEGORIES } from '@/lib/spaces';

export type StudioKind = 'project' | 'club' | 'space' | 'page';

type Item = {
  id?: string;
  title?: string | null;
  description?: string | null;
  content?: string | null;
  template?: string | null;
  status?: string | null;
  image?: string | null;
  images?: string | null;
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
  address?: string | null;
  lat?: number | null;
  lng?: number | null;
  capacity?: number | null;
  category?: string | null;
  amenities?: string | null;
  bookingMode?: string | null;
  openTime?: string | null;
  closeTime?: string | null;
  slotStepMin?: number | null;
  slug?: string | null;
  menuPosition?: string | null;
  publishedAt?: Date | string | null;
};

const STEPS_DEFAULT = [
  { id: 'main', label: 'Основное' },
  { id: 'copy', label: 'Описание' },
  { id: 'join', label: 'Участие' },
  { id: 'team', label: 'Команда' },
  { id: 'media', label: 'Медиа' },
  { id: 'publish', label: 'Публикация' },
] as const;

const STEPS_SPACE = [
  { id: 'main', label: 'Основное' },
  { id: 'copy', label: 'Описание' },
  { id: 'venue', label: 'Площадка' },
  { id: 'join', label: 'Запись' },
  { id: 'media', label: 'Медиа' },
  { id: 'publish', label: 'Публикация' },
] as const;

const STEPS_PAGE = [
  { id: 'main', label: 'Основное' },
  { id: 'copy', label: 'Текст' },
  { id: 'media', label: 'Медиа' },
  { id: 'publish', label: 'Публикация' },
] as const;

function stepsFor(kind: StudioKind) {
  if (kind === 'space') return STEPS_SPACE;
  if (kind === 'page') return STEPS_PAGE;
  return STEPS_DEFAULT;
}

function defaultFormat(kind: StudioKind) {
  if (kind === 'club') return 'Клуб';
  if (kind === 'space') return 'Пространство';
  if (kind === 'page') return 'Страница';
  return 'Проект';
}

function defaultJoin(kind: StudioKind): JoinMode {
  if (kind === 'page') return 'none';
  if (kind === 'space') return 'apply';
  return 'apply';
}

function publicHref(kind: StudioKind, item?: Item | null) {
  if (!item?.id) return null;
  if (kind === 'club') return `/clubs/${item.id}`;
  if (kind === 'project') return `/projects/${item.id}`;
  if (kind === 'space') return `/spaces/${item.id}`;
  if (kind === 'page' && item.slug) {
    if (item.slug === 'privacy') return '/privacy';
    return `/p/${item.slug}`;
  }
  return null;
}

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
  const steps = stepsFor(kind);
  const studio0 = parseStudioJson(item?.studioJson);
  if (item?.curatorName && !studio0.curatorName) studio0.curatorName = item.curatorName;
  if (item?.curatorContact && !studio0.curatorContact) studio0.curatorContact = item.curatorContact;
  if (item?.signupUrl && !studio0.signupUrl) studio0.signupUrl = item.signupUrl;
  if (item?.tags && !studio0.tags) studio0.tags = item.tags;
  if (!studio0.joinMode || (kind === 'page' && !item?.studioJson)) studio0.joinMode = defaultJoin(kind);

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(item?.title || '');
  const [status, setStatus] = useState(item?.status || (kind === 'page' ? 'PUBLISHED' : 'DRAFT'));
  const [template, setTemplate] = useState(item?.template || 'DEFAULT');
  const [mission, setMission] = useState(item?.mission || studio0.mission || '');
  const [goal, setGoal] = useState(item?.goal || studio0.goal || '');
  const [audience, setAudience] = useState(studio0.audience);
  const [whatHappens, setWhatHappens] = useState(studio0.whatHappens);
  const [howToJoin, setHowToJoin] = useState(studio0.howToJoin);
  const [joinMode, setJoinMode] = useState<JoinMode>(studio0.joinMode || defaultJoin(kind));
  const [format, setFormat] = useState(studio0.format || defaultFormat(kind));
  const [slug, setSlug] = useState(item?.slug || '');
  const bodyHtml = item?.content || item?.description || '';
  const cover = item?.image || (item?.images && item.images !== '[]' ? item.images : null);
  const draftKey = `yp-studio-${kind}-${item?.id || 'new'}`;
  const stepId = steps[step]?.id || 'main';

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
        description: bodyHtml,
        mission,
        goal,
        image: cover,
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
          mission,
          goal,
        },
      }),
    [title, bodyHtml, cover, mission, goal, audience, whatHappens, howToJoin, joinMode, format, studio0]
  );
  const ready = checklist.filter((c) => c.ok).length;
  const href = publicHref(kind, item);

  return (
    <div className="admin-studio">
      <nav className="admin-studio__steps" aria-label="Шаги">
        {steps.map((s, i) => (
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

      <section className="admin-studio__panel" hidden={stepId !== 'main'}>
        <p className="admin-studio-hint">Шаблон подставляет тексты — их можно править.</p>
        <div className="admin-studio__chips">
          {Object.entries(YOUTH_TEMPLATES)
            .filter(([k]) => (kind === 'page' ? true : k !== 'page'))
            .map(([k, t]) => (
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
        {kind === 'page' ? (
          <label className="admin-studio__field">
            <span>URL (slug)</span>
            {item?.slug === 'privacy' || item?.slug === 'about' || item?.slug === 'rules' || item?.slug === 'terms' ? (
              <>
                <input type="hidden" name="slug" value={item.slug} />
                <input value={item.slug} disabled />
              </>
            ) : (
              <input name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="about" required={!item?.id} />
            )}
          </label>
        ) : null}
        <label className="admin-studio__field">
          <span>Формат</span>
          <input name="format" value={format} onChange={(e) => setFormat(e.target.value)} />
        </label>
        <label className="admin-studio__field">
          <span>Как выглядит страница</span>
          <select name="template" value={template} onChange={(e) => setTemplate(e.target.value)}>
            <option value="DEFAULT">Текст и блоки</option>
            <option value="GALLERY">Галерея</option>
            <option value="TEAM">Команда</option>
            <option value="HERO">Крупный заголовок</option>
            {kind === 'space' || kind === 'page' ? <option value="FAQ">Вопрос-ответ</option> : null}
          </select>
        </label>
        {kind === 'page' ? (
          <label className="admin-studio__field">
            <span>Позиция в меню</span>
            <select name="menuPosition" defaultValue={item?.menuPosition || 'NONE'}>
              <option value="NONE">Скрыта (только по ссылке)</option>
              <option value="HEADER_MAIN">Главное меню</option>
              <option value="HEADER_SUB">Подменю «Ещё»</option>
              <option value="FOOTER">Подвал</option>
            </select>
          </label>
        ) : null}
      </section>

      <section className="admin-studio__panel" hidden={stepId !== 'copy'}>
        <label className="admin-studio__field">
          <span>Зачем идти / читать</span>
          <textarea name="mission" rows={2} value={mission} onChange={(e) => setMission(e.target.value)} />
        </label>
        <label className="admin-studio__field">
          <span>Кому подойдёт</span>
          <textarea name="audience" rows={2} value={audience} onChange={(e) => setAudience(e.target.value)} />
        </label>
        <label className="admin-studio__field">
          <span>Что будет / о чём страница</span>
          <textarea name="whatHappens" rows={2} value={whatHappens} onChange={(e) => setWhatHappens(e.target.value)} />
        </label>
        <label className="admin-studio__field">
          <span>Что получит читатель</span>
          <textarea name="goal" rows={2} value={goal} onChange={(e) => setGoal(e.target.value)} />
        </label>
        <label className="admin-studio__field">
          <span>
            {kind === 'page' ? 'Содержание' : 'Полное описание'} <em>*</em>
          </span>
          <RichTextInput name={kind === 'page' ? 'content' : 'description'} defaultValue={bodyHtml} />
        </label>
      </section>

      {kind === 'space' ? (
        <section className="admin-studio__panel" hidden={stepId !== 'venue'}>
          <label className="admin-studio__field">
            <span>Адрес</span>
            <input name="address" defaultValue={item?.address || ''} placeholder="г. Сочи, ул. …" required />
          </label>
          <div className="admin-form-grid admin-form-grid--2">
            <label className="admin-studio__field">
              <span>Широта</span>
              <input type="number" step="any" name="lat" defaultValue={item?.lat ?? ''} />
            </label>
            <label className="admin-studio__field">
              <span>Долгота</span>
              <input type="number" step="any" name="lng" defaultValue={item?.lng ?? ''} />
            </label>
          </div>
          <label className="admin-studio__field">
            <span>Категория</span>
            <select name="category" defaultValue={item?.category || 'Общее'}>
              {SPACE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="admin-studio__field">
            <span>Сценарий записи</span>
            <select name="bookingMode" defaultValue={item?.bookingMode || 'HALL'}>
              <option value="HALL">Только зал</option>
              <option value="COWORKING">Только коворкинг</option>
              <option value="BOTH">Зал и коворкинг</option>
            </select>
          </label>
          <label className="admin-studio__field">
            <span>Вместимость</span>
            <input type="number" name="capacity" defaultValue={item?.capacity || 50} required />
          </label>
          <div className="admin-form-grid admin-form-grid--2">
            <label className="admin-studio__field">
              <span>Открытие</span>
              <input name="openTime" defaultValue={item?.openTime || ''} placeholder="09:00" />
            </label>
            <label className="admin-studio__field">
              <span>Закрытие</span>
              <input name="closeTime" defaultValue={item?.closeTime || ''} placeholder="21:00" />
            </label>
          </div>
          <label className="admin-studio__field">
            <span>Шаг сетки (мин)</span>
            <select name="slotStepMin" defaultValue={String(item?.slotStepMin || 60)}>
              <option value="30">30</option>
              <option value="60">60</option>
            </select>
          </label>
          <SpaceAmenitiesField defaultValue={item?.amenities} />
        </section>
      ) : null}

      {kind !== 'page' ? (
        <section className="admin-studio__panel" hidden={stepId !== 'join'}>
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
          {kind === 'space' ? (
            <>
              <label className="admin-studio__field">
                <span>Кто отвечает за площадку</span>
                <input name="curatorName" defaultValue={studio0.curatorName} />
              </label>
              <label className="admin-studio__field">
                <span>Контакт</span>
                <input name="curatorContact" defaultValue={studio0.curatorContact} />
              </label>
            </>
          ) : null}
        </section>
      ) : (
        <input type="hidden" name="joinMode" value="none" />
      )}

      {kind === 'project' || kind === 'club' ? (
        <section className="admin-studio__panel" hidden={stepId !== 'team'}>
          <label className="admin-studio__field">
            <span>Кто ведёт</span>
            <input name="curatorName" defaultValue={studio0.curatorName} />
          </label>
          <label className="admin-studio__field">
            <span>Контакт куратора</span>
            <input name="curatorContact" defaultValue={studio0.curatorContact} />
          </label>
          {kind === 'club' ? (
            <label className="admin-studio__check">
              <input type="checkbox" name="curatorContactPublic" value="true" defaultChecked={item?.curatorContactPublic !== false} />
              Показывать контакт на странице
            </label>
          ) : null}
          <label className="admin-studio__field">
            <span>Теги</span>
            <input name="tags" defaultValue={studio0.tags} />
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
      ) : null}

      <section className="admin-studio__panel" hidden={stepId !== 'media'}>
        <CoverImageField
          currentImage={cover}
          label="Обложка (16:9, лучше WebP)"
          hiddenName={kind === 'page' ? 'images' : 'image'}
        />
        {kind !== 'page' ? (
          <GalleryPickerField name="gallery" label="Галерея" defaultValue={item?.gallery} pool={pool} />
        ) : null}
      </section>

      <section className="admin-studio__panel" hidden={stepId !== 'publish'}>
        <label className="admin-studio__field">
          <span>Статус</span>
          <select name="status" value={status} onChange={(e) => setStatus(e.target.value)}>
            {(kind === 'page' ? PAGE_STATUSES : CATALOG_STATUSES).map((s) => (
              <option key={s} value={s}>
                {kind === 'page' ? PAGE_STATUS_RU[s] : CATALOG_STATUS_RU[s]}
              </option>
            ))}
          </select>
        </label>
        {kind === 'page' ? (
          <label className="admin-studio__field">
            <span>Дата публикации</span>
            <input
              type="datetime-local"
              name="publishedAt"
              defaultValue={item?.publishedAt ? new Date(item.publishedAt).toISOString().slice(0, 16) : ''}
            />
          </label>
        ) : null}
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
        </div>
        {href ? (
          <p className="admin-studio-hint">
            <Link href={href} target="_blank">
              Открыть публичную страницу
            </Link>
          </p>
        ) : null}
      </section>

      <aside className="admin-studio__live" aria-live="polite">
        <div className="admin-studio__card-preview">
          <span className="admin-studio__badge">
            {kind === 'page' ? PAGE_STATUS_RU[status] || status : CATALOG_STATUS_RU[status] || status}
          </span>
          <h3>{title || 'Без названия'}</h3>
          <p>{mission || stripHtml(bodyHtml, 120) || 'Кратко появится здесь'}</p>
          <small>
            {format} · {JOIN_MODES.find((m) => m.id === joinMode)?.label}
          </small>
        </div>
      </aside>

      <div className="admin-studio__nav">
        <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Назад
        </button>
        {step < steps.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setStep((s) => Math.min(steps.length - 1, s + 1))}>
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
