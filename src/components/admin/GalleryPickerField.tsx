'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Check, ImagePlus, Trash2 } from 'lucide-react';
import { parseGalleryItems, galleryUrls, type GalleryItem } from '@/lib/gallery-shared';

type Props = {
  name?: string;
  label?: string;
  defaultValue?: string | null;
  /** Shared org gallery pool (URLs) */
  pool?: string[];
  max?: number;
};

async function uploadImage(file: File): Promise<string> {
  const body = new FormData();
  body.set('file', file);
  const res = await fetch('/api/upload', { method: 'POST', body });
  const data = (await res.json().catch(() => null)) as { url?: string; message?: string } | null;
  if (!res.ok || !data?.url) {
    throw new Error(data?.message || 'Не удалось загрузить фото');
  }
  return data.url;
}

/** Gallery editor: device photos first, optional URLs. Stores JSON string[]. */
export default function GalleryPickerField({
  name = 'gallery',
  label = 'Галерея',
  defaultValue,
  pool = [],
  max = 24,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const initial = useMemo(() => parseGalleryItems(defaultValue, max), [defaultValue, max]);
  const [items, setItems] = useState<GalleryItem[]>(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const selected = useMemo(() => new Set(items.map((i) => i.url)), [items]);
  const serialized = JSON.stringify(galleryUrls(items).slice(0, max));
  const left = Math.max(0, max - items.length);

  const togglePool = (url: string) => {
    setItems((prev) => {
      if (prev.some((i) => i.url === url)) return prev.filter((i) => i.url !== url);
      if (prev.length >= max) return prev;
      return [...prev, { url }];
    });
  };

  const removeAt = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const onFiles = async (list: FileList | File[] | null) => {
    if (!list || busy) return;
    const files = Array.from(list).filter((f) => f.type.startsWith('image/') || /\.(jpe?g|png|webp|gif)$/i.test(f.name));
    if (!files.length) return;
    setBusy(true);
    setError('');
    try {
      const next: GalleryItem[] = [...items];
      for (const file of files) {
        if (next.length >= max) break;
        const url = await uploadImage(file);
        if (!next.some((i) => i.url === url)) next.push({ url });
      }
      setItems(next.slice(0, max));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ошибка загрузки');
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="gallery-picker-field">
      <label className="gallery-picker-field__label" htmlFor={inputId}>
        {label}
      </label>
      <input type="hidden" name={name} value={serialized} />

      <label
        htmlFor={inputId}
        className={`gallery-picker-field__drop${busy ? ' is-busy' : ''}`}
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={(e) => {
          e.preventDefault();
          void onFiles(e.dataTransfer.files);
        }}
      >
        <ImagePlus size={22} aria-hidden />
        <strong>{busy ? 'Загружаем…' : 'Фото с телефона или компьютера'}</strong>
        <span>Галерея, файлы или перетащите сюда. Можно сразу несколько. Ещё {left}.</span>
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        hidden
        disabled={busy || left <= 0}
        onChange={(e) => void onFiles(e.target.files)}
      />

      {items.length > 0 ? (
        <div className="gallery-picker-field__chosen" role="list">
          {items.map((item, index) => (
            <div
              key={`${item.url}-${index}`}
              role="listitem"
              className="gallery-picker-field__chosen-item"
              style={{ backgroundImage: `url(${item.url})` }}
            >
              <button
                type="button"
                className="gallery-picker-field__remove"
                aria-label="Убрать фото"
                onClick={() => removeAt(index)}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      ) : null}

      {pool.length > 0 ? (
        <div className="gallery-picker-field__pool" role="list" aria-label="Общая база">
          {pool.map((url) => {
            const on = selected.has(url);
            return (
              <button
                key={url}
                type="button"
                role="listitem"
                className={`gallery-picker-field__thumb${on ? ' is-on' : ''}`}
                onClick={() => togglePool(url)}
                title={url}
                style={{ backgroundImage: `url(${url})` }}
              >
                {on ? (
                  <span className="gallery-picker-field__check">
                    <Check size={12} />
                  </span>
                ) : (
                  <span className="gallery-picker-field__add">
                    <ImagePlus size={14} />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      ) : null}

      <details className="gallery-picker-field__advanced">
        <summary>Свой URL, если фото уже на сайте</summary>
        <textarea
          className="settings-input"
          rows={2}
          value={items.map((i) => i.url).join('\n')}
          onChange={(e) => setItems(parseGalleryItems(e.target.value, max))}
          placeholder={'/uploads/…\nпо одной ссылке на строку'}
        />
      </details>
      {error ? <p className="gallery-picker-field__error">{error}</p> : null}
      <p className="gallery-picker-field__hint">
        JPG, PNG или WebP. Обложка отдельно выше. Макс. {max} кадров.
      </p>
    </div>
  );
}
