'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import CoverImageField from '@/components/admin/CoverImageField';
import { clearDraft, readDraft, useDraftAutosave } from '@/lib/use-draft-autosave';

type Draft = {
  title: string;
  text: string;
  videoEmbedUrl: string;
  status: string;
  publishedAt: string;
  step: number;
};

const STEPS = ['Текст', 'Медиа', 'Публикация'] as const;

export default function NewsDraftForm({
  action,
  editingId,
  initial,
}: {
  action: (formData: FormData) => void | Promise<void>;
  editingId?: string;
  initial: {
    title?: string | null;
    text?: string | null;
    imageUrl?: string | null;
    videoEmbedUrl?: string | null;
    status?: string | null;
    publishedAt?: string | null;
  };
}) {
  const key = `yp-news-draft-${editingId || 'new'}`;
  const [step, setStep] = useState(0);
  const [title, setTitle] = useState(initial.title ?? '');
  const [text, setText] = useState(initial.text ?? '');
  const [videoEmbedUrl, setVideo] = useState(initial.videoEmbedUrl ?? '');
  const [status, setStatus] = useState(initial.status ?? 'PUBLISHED');
  const [publishedAt, setPublishedAt] = useState(initial.publishedAt ?? '');

  useEffect(() => {
    const d = readDraft<Draft>(key);
    if (!d) return;
    if (d.title) setTitle(d.title);
    if (d.text) setText(d.text);
    if (d.videoEmbedUrl) setVideo(d.videoEmbedUrl);
    if (d.status) setStatus(d.status);
    if (d.publishedAt) setPublishedAt(d.publishedAt);
    if (typeof d.step === 'number') setStep(d.step);
  }, [key]);

  const payload = useMemo(
    () => ({ title, text, videoEmbedUrl, status, publishedAt, step }),
    [title, text, videoEmbedUrl, status, publishedAt, step]
  );
  useDraftAutosave(key, payload);

  return (
    <form
      action={async (fd) => {
        clearDraft(key);
        await action(fd);
      }}
      className="glass news-draft-form"
      style={{ padding: '1.25rem', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {editingId ? <input type="hidden" name="id" value={editingId} /> : null}
      <nav className="admin-studio__steps" aria-label="Шаги новости">
        {STEPS.map((label, i) => (
          <button
            key={label}
            type="button"
            className={`admin-studio__step${i === step ? ' is-on' : ''}`}
            onClick={() => setStep(i)}
          >
            {i + 1}. {label}
          </button>
        ))}
      </nav>
      <p className="admin-studio-hint" style={{ margin: 0, fontSize: '0.82rem' }}>
        Черновик сохраняется автоматически каждую секунду
      </p>
      <div hidden={step !== 0}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Заголовок</label>
          <input
            name="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
            placeholder="Заголовок"
          />
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Текст *</label>
          <textarea
            name="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0', fontFamily: 'inherit' }}
          />
        </div>
      </div>
      <div hidden={step !== 1}>
        <CoverImageField currentImage={initial.imageUrl || null} hiddenName="imageUrl" name="imageFile" label="Обложка" />
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Видео VK (embed)</label>
          <input
            name="videoEmbedUrl"
            value={videoEmbedUrl}
            onChange={(e) => setVideo(e.target.value)}
            placeholder="https://vk.com/video_ext.php?oid=…&id=…"
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>
      <div hidden={step !== 2} className="admin-form-grid admin-form-grid--2">
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Статус</label>
          <select
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          >
            <option value="PUBLISHED">Опубликовано</option>
            <option value="DRAFT">Черновик</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.4rem', fontWeight: 500 }}>Дата публикации</label>
          <input
            type="datetime-local"
            name="publishedAt"
            value={publishedAt}
            onChange={(e) => setPublishedAt(e.target.value)}
            style={{ width: '100%', padding: '0.6rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
        <button type="button" className="btn btn-secondary" disabled={step === 0} onClick={() => setStep((s) => Math.max(0, s - 1))}>
          Назад
        </button>
        {step < STEPS.length - 1 ? (
          <button type="button" className="btn btn-primary" onClick={() => setStep((s) => s + 1)}>
            Далее
          </button>
        ) : (
          <button type="submit" className="btn btn-primary">
            {editingId ? 'Сохранить' : 'Создать'}
          </button>
        )}
        <Link href="/admin/news" className="btn btn-secondary">
          Отмена
        </Link>
      </div>
    </form>
  );
}
