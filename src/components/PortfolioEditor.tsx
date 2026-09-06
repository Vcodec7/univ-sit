'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Plus, Search, Trash2, Upload, Eye, FileText, Image as ImageIcon, Sparkles } from 'lucide-react';
import {
  ACHIEVEMENTS,
  CATEGORY_META,
  groupByAchievementCategory,
  TIER_META,
} from '@/lib/achievements';
import { PORTFOLIO_STATUS_RU, statusRu } from '@/lib/status-labels-ru';

type Section = { title: string; body: string; type: string };
type Cert = {
  title: string;
  issuer?: string | null;
  issuedAt?: string | null;
  fileUrl?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
};

type Portfolio = {
  id: string;
  userId: string;
  headline: string | null;
  summary: string | null;
  coverImage: string | null;
  status: string;
  rejectReason: string | null;
  sections: Section[];
  certificates: Cert[];
  achievementLinks: { code: string }[];
  user?: { name?: string | null; image?: string | null };
};


export default function PortfolioEditor() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [unlocked, setUnlocked] = useState<string[]>([]);
  const [achQuery, setAchQuery] = useState('');
  const [headline, setHeadline] = useState('');
  const [summary, setSummary] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [sections, setSections] = useState<Section[]>([{ title: 'О себе', body: '', type: 'ABOUT' }]);
  const [certs, setCerts] = useState<Cert[]>([]);
  const [achCodes, setAchCodes] = useState<string[]>([]);
  const [cooldownDays, setCooldownDays] = useState(7);
  const [nextSubmitAt, setNextSubmitAt] = useState<string | null>(null);
  const [canSubmitNow, setCanSubmitNow] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch('/api/user/portfolio');
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка');
    const p = data.portfolio as Portfolio;
    setPortfolio(p);
    setUnlocked(data.unlockedAchievementCodes || []);
    setCooldownDays(typeof data.cooldownDays === 'number' ? data.cooldownDays : 7);
    setNextSubmitAt(data.nextSubmitAt || null);
    setCanSubmitNow(data.canSubmitNow !== false);
    setHeadline(p.headline || '');
    setSummary(p.summary || '');
    setCoverImage(p.coverImage || '');
    setSections(
      p.sections?.length
        ? p.sections.map((s) => ({ title: s.title, body: s.body, type: s.type || 'CUSTOM' }))
        : [{ title: 'О себе', body: '', type: 'ABOUT' }]
    );
    setCerts(
      (p.certificates || []).map((c) => ({
        title: c.title,
        issuer: c.issuer,
        issuedAt: c.issuedAt ? String(c.issuedAt).slice(0, 10) : '',
        fileUrl: c.fileUrl,
        fileName: c.fileName,
        mimeType: c.mimeType,
      }))
    );
    setAchCodes((p.achievementLinks || []).map((a) => a.code));
  }, []);

  useEffect(() => {
    load()
      .catch((e) => toast.error(e instanceof Error ? e.message : 'Ошибка'))
      .finally(() => setLoading(false));
  }, [load]);

  const unlockedFiltered = useMemo(() => {
    const q = achQuery.trim().toLowerCase();
    const matched = unlocked.filter((code) => {
      if (!q) return true;
      const def = ACHIEVEMENTS.find((a) => a.code === code);
      if (!def) return code.toLowerCase().includes(q);
      return (
        def.title.toLowerCase().includes(q) ||
        def.description.toLowerCase().includes(q) ||
        code.toLowerCase().includes(q)
      );
    });
    return groupByAchievementCategory(matched.map((code) => ({ code })));
  }, [unlocked, achQuery]);

  const save = async (submit: boolean) => {
    setSaving(true);
    try {
      const res = await fetch('/api/user/portfolio', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: headline.trim() || null,
          summary: summary.trim() || null,
          coverImage: coverImage || null,
          sections,
          certificates: certs,
          achievementCodes: achCodes,
          submit,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Не удалось сохранить');
      setPortfolio(data.portfolio);
      if (typeof data.cooldownDays === 'number') setCooldownDays(data.cooldownDays);
      if (data.nextSubmitAt !== undefined) setNextSubmitAt(data.nextSubmitAt || null);
      if (data.canSubmitNow !== undefined) setCanSubmitNow(Boolean(data.canSubmitNow));
      toast.success(submit ? 'Отправлено на проверку' : 'Сохранено');
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const submitBlocked =
    portfolio?.status === 'PENDING' ||
    !canSubmitNow ||
    (Boolean(nextSubmitAt) && new Date(nextSubmitAt!).getTime() > Date.now());

  const statusKey = portfolio?.status || 'DRAFT';
  const filledSections = sections.filter((s) => s.title.trim() || s.body.trim()).length;
  const certsWithFile = certs.filter((c) => c.fileUrl).length;

  const upload = async (file: File, kind: 'cover' | 'certificate') => {
    const fd = new FormData();
    fd.set('kind', kind);
    fd.set('file', file);
    const res = await fetch('/api/user/portfolio/upload', { method: 'POST', body: fd });
    const contentType = res.headers.get('content-type') || '';
    if (res.status === 413) {
      throw new Error('Файл слишком большой для сервера. Выберите фото меньше 15 МБ.');
    }
    if (!contentType.includes('application/json')) {
      throw new Error(
        res.ok
          ? 'Некорректный ответ сервера'
          : `Ошибка загрузки (${res.status}). Попробуйте JPEG/PNG поменьше.`
      );
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || 'Ошибка загрузки');
    return data as { url: string; fileName?: string; mimeType?: string };
  };

  if (loading) return <div className="pf-studio pf-studio--loading">Загрузка портфолио…</div>;

  return (
    <div className="pf-studio">
      <div className="pf-studio__head">
        <div>
          <span className={`pf-status pf-status--${statusKey.toLowerCase()}`}>
            {statusRu(PORTFOLIO_STATUS_RU, statusKey)}
          </span>
          <h2>Моя витрина</h2>
          <p>
            Заголовок, история, разделы, грамоты и достижения портала. После одобрения страница открывается
            публично и скачивается с подписью сайта.
          </p>
          {portfolio?.status === 'REJECTED' && portfolio.rejectReason ? (
            <p className="pf-studio__reject">{portfolio.rejectReason}</p>
          ) : null}
        </div>
        <div className="pf-studio__actions">
          {portfolio?.status === 'APPROVED' && portfolio.userId ? (
            <>
              <Link href={`/portfolio/${portfolio.userId}`} className="btn btn-secondary btn-sm">
                <Eye size={14} /> Открыть
              </Link>
              <a
                href={`/api/portfolio/${portfolio.userId}/download?mode=download`}
                className="btn btn-primary btn-sm"
                target="_blank"
                rel="noreferrer"
              >
                Скачать
              </a>
            </>
          ) : null}
          <button type="button" className="btn btn-secondary btn-sm" disabled={saving} onClick={() => void save(false)}>
            Сохранить
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            disabled={saving || submitBlocked}
            onClick={() => void save(true)}
            title={
              portfolio?.status === 'PENDING'
                ? 'Уже на проверке'
                : submitBlocked && nextSubmitAt
                  ? `Доступно с ${new Date(nextSubmitAt).toLocaleString('ru-RU')}`
                  : undefined
            }
          >
            На проверку
          </button>
        </div>
        <ul className="pf-studio__stats">
          <li>
            <strong>{filledSections}</strong>
            <span>разделов</span>
          </li>
          <li>
            <strong>{certs.length}</strong>
            <span>грамот{certsWithFile ? ` · ${certsWithFile} с файлом` : ''}</span>
          </li>
          <li>
            <strong>{achCodes.length}</strong>
            <span>достижений</span>
          </li>
        </ul>
        {cooldownDays > 0 ? (
          <p className={`pf-studio__cool${submitBlocked && nextSubmitAt ? ' is-wait' : ''}`}>
            Проверка — не чаще 1 раза в {cooldownDays}{' '}
            {cooldownDays === 1 ? 'день' : cooldownDays < 5 ? 'дня' : 'дней'}
            {submitBlocked && nextSubmitAt && portfolio?.status !== 'PENDING'
              ? ` · следующая с ${new Date(nextSubmitAt).toLocaleString('ru-RU')}`
              : ''}
            .
          </p>
        ) : null}
      </div>

      <div className="pf-preview" aria-hidden>
        <div
          className="pf-preview__cover"
          style={coverImage ? { backgroundImage: `url(${coverImage})` } : undefined}
        />
        <div className="pf-preview__copy">
          <em>Как увидят</em>
          <strong>{headline.trim() || 'Ваш заголовок'}</strong>
          <span>{summary.trim() || 'Короткий рассказ о себе появится здесь.'}</span>
        </div>
      </div>

      <div className="pf-grid">
        <label className="pf-field">
          <span>Заголовок</span>
          <input
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
            placeholder="Куратор проектов · волонтёр · медиа"
            className="pf-input"
          />
        </label>
        <label className="pf-field pf-field--wide">
          <span>О себе</span>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            rows={4}
            placeholder="Коротко: чем занимаетесь и чем гордитесь"
            className="pf-input"
          />
        </label>
      </div>

      <div className="pf-cover">
        <div className="pf-cover__label">
          <ImageIcon size={16} aria-hidden /> Обложка
        </div>
        {coverImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={coverImage} alt="" className="pf-cover__img" />
        ) : (
          <div className="pf-cover__empty">Фото зала, проекта или команды</div>
        )}
        <label className="btn btn-secondary btn-sm pf-cover__btn">
          <Upload size={16} /> Загрузить
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
            hidden
            onChange={async (e) => {
              const input = e.target;
              const file = input.files?.[0];
              input.value = '';
              if (!file) return;
              try {
                toast.loading('Оптимизируем и загружаем…', { id: 'portfolio-cover' });
                const data = await upload(file, 'cover');
                setCoverImage(data.url);
                toast.success('Обложка загружена (сжата для сайта)', { id: 'portfolio-cover' });
              } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Ошибка', { id: 'portfolio-cover' });
              }
            }}
          />
        </label>
        <p className="pf-hint">JPEG, PNG, WebP или GIF · до 15 МБ · сожмём в WebP для экрана</p>
      </div>

      <div className="pf-block">
        <div className="pf-block__head">
          <strong>Разделы</strong>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setSections((s) => [...s, { title: 'Новый раздел', body: '', type: 'CUSTOM' }])}
          >
            <Plus size={14} /> Добавить
          </button>
        </div>
        <div className="pf-sections">
          {sections.map((s, idx) => (
            <div key={idx} className="pf-section">
              <div className="pf-section__row">
                <input
                  value={s.title}
                  className="pf-input"
                  onChange={(e) =>
                    setSections((rows) => rows.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)))
                  }
                />
                <button
                  type="button"
                  aria-label="Удалить"
                  className="pf-icon-btn"
                  onClick={() => setSections((rows) => rows.filter((_, i) => i !== idx))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
              <div className="pf-types">
                {[
                  { id: 'ABOUT', label: 'О себе' },
                  { id: 'EXPERIENCE', label: 'Опыт' },
                  { id: 'PROJECT', label: 'Проект' },
                  { id: 'CUSTOM', label: 'Свой' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={s.type === t.id ? 'is-on' : undefined}
                    onClick={() =>
                      setSections((rows) => rows.map((r, i) => (i === idx ? { ...r, type: t.id } : r)))
                    }
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <textarea
                value={s.body}
                className="pf-input"
                rows={3}
                onChange={(e) =>
                  setSections((rows) => rows.map((r, i) => (i === idx ? { ...r, body: e.target.value } : r)))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="pf-block">
        <div className="pf-block__head">
          <strong>Грамоты и дипломы</strong>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={() => setCerts((c) => [...c, { title: '', issuer: '', issuedAt: '' }])}
          >
            <Plus size={14} /> Добавить
          </button>
        </div>
        <p className="pf-hint">
          Свой файл или официальный бланк из{' '}
          <Link href="/dashboard/awards">наград</Link> — PDF остаётся на сайте.
        </p>
        <div className="pf-certs">
          {certs.length === 0 ? (
            <p className="pf-empty">Пока пусто — добавьте грамоту или дождитесь выдачи от администрации.</p>
          ) : null}
          {certs.map((c, idx) => (
            <div key={idx} className="pf-cert">
              <div className="pf-cert__thumb" aria-hidden>
                {c.fileUrl && c.mimeType && /^image\//i.test(c.mimeType) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.fileUrl} alt="" />
                ) : (
                  <FileText size={22} />
                )}
              </div>
              <input
                placeholder="Название"
                className="pf-input"
                value={c.title}
                onChange={(e) => setCerts((rows) => rows.map((r, i) => (i === idx ? { ...r, title: e.target.value } : r)))}
              />
              <div className="pf-cert__row">
                <input
                  placeholder="Кем выдано"
                  className="pf-input"
                  value={c.issuer || ''}
                  onChange={(e) => setCerts((rows) => rows.map((r, i) => (i === idx ? { ...r, issuer: e.target.value } : r)))}
                />
                <input
                  type="date"
                  className="pf-input"
                  value={c.issuedAt || ''}
                  onChange={(e) => setCerts((rows) => rows.map((r, i) => (i === idx ? { ...r, issuedAt: e.target.value } : r)))}
                />
              </div>
              <div className="pf-cert__files">
                <label className="btn btn-secondary btn-sm">
                  Файл
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
                    hidden
                    onChange={async (e) => {
                      const input = e.target;
                      const file = input.files?.[0];
                      input.value = '';
                      if (!file) return;
                      try {
                        toast.loading('Загружаем…', { id: 'portfolio-cert' });
                        const data = await upload(file, 'certificate');
                        setCerts((rows) =>
                          rows.map((r, i) =>
                            i === idx
                              ? { ...r, fileUrl: data.url, fileName: data.fileName, mimeType: data.mimeType }
                              : r
                          )
                        );
                        toast.success('Файл прикреплён', { id: 'portfolio-cert' });
                      } catch (err) {
                        toast.error(err instanceof Error ? err.message : 'Ошибка', { id: 'portfolio-cert' });
                      }
                    }}
                  />
                </label>
                {c.fileUrl ? <span>{c.fileName || 'файл'}</span> : null}
                <button
                  type="button"
                  className="pf-icon-btn"
                  aria-label="Удалить"
                  onClick={() => setCerts((rows) => rows.filter((_, i) => i !== idx))}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="portfolio-editor-achs pf-block">
        <div className="portfolio-editor-achs__head">
          <strong>
            <Sparkles size={15} aria-hidden /> Достижения портала
          </strong>
          <span>
            Выбрано {achCodes.length}
            {unlocked.length ? ` · доступно ${unlocked.length}` : ''}
          </span>
        </div>
        {unlocked.length === 0 ? (
          <span style={{ color: 'var(--muted)', fontSize: '0.88rem' }}>Пока нет открытых ачивок</span>
        ) : (
          <>
            <label className="ach-search portfolio-editor-achs__search">
              <Search size={15} aria-hidden />
              <input
                type="search"
                value={achQuery}
                onChange={(e) => setAchQuery(e.target.value)}
                placeholder="Поиск по достижениям…"
                aria-label="Поиск достижений для портфолио"
              />
            </label>
            <div className="portfolio-editor-achs__groups">
              {unlockedFiltered.length === 0 ? (
                <p className="ach-empty" style={{ margin: 0 }}>
                  Ничего не найдено
                </p>
              ) : (
                unlockedFiltered.map((group) => (
                  <div key={group.category} className="portfolio-editor-achs__group">
                    <h4>
                      {CATEGORY_META[group.category].label}
                      <em>{group.items.length}</em>
                    </h4>
                    <div className="portfolio-editor-achs__chips">
                      {group.items.map(({ code }) => {
                        const def = ACHIEVEMENTS.find((a) => a.code === code);
                        const on = achCodes.includes(code);
                        const tier = def ? TIER_META[def.tier] : TIER_META.bronze;
                        return (
                          <button
                            key={code}
                            type="button"
                            className={`portfolio-editor-ach${on ? ' is-on' : ''}`}
                            title={def?.description || code}
                            onClick={() =>
                              setAchCodes((curr) =>
                                curr.includes(code) ? curr.filter((c) => c !== code) : [...curr, code]
                              )
                            }
                            style={
                              on
                                ? {
                                    borderColor: `${tier.color}55`,
                                    background: tier.bg,
                                    color: tier.color,
                                  }
                                : undefined
                            }
                          >
                            {def?.title || code}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>

      {portfolio?.status === 'APPROVED' && portfolio.userId ? (
        <div className="pf-studio__actions">
          <Link href={`/portfolio/${portfolio.userId}`} className="btn btn-secondary btn-sm">
            Публичная страница
          </Link>
          <a
            href={`/api/portfolio/${portfolio.userId}/download?mode=download`}
            className="btn btn-primary btn-sm"
            target="_blank"
            rel="noreferrer"
          >
            Скачать файл
          </a>
          <a
            href={`/api/portfolio/${portfolio.userId}/download?mode=print`}
            className="btn btn-secondary btn-sm"
            target="_blank"
            rel="noreferrer"
          >
            Печать
          </a>
        </div>
      ) : null}
    </div>
  );
}
