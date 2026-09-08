'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Trash2 } from 'lucide-react';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { publishLabel } from '@/lib/publish';

export type NewsRow = {
  id: string;
  title: string | null;
  text: string | null;
  status: string | null;
  publishedAt: string | null;
  createdAt: string;
  videoEmbedUrl: string | null;
};

export default function NewsListBoard({
  rows,
  deleteItem,
  bulkDelete,
}: {
  rows: NewsRow[];
  deleteItem: (formData: FormData) => void | Promise<void>;
  bulkDelete: (formData: FormData) => void | Promise<void>;
}) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const selected = useMemo(() => rows.filter((r) => picked[r.id]).map((r) => r.id), [rows, picked]);
  const allOn = rows.length > 0 && rows.every((r) => picked[r.id]);

  return (
    <>
      {selected.length > 0 ? (
        <form action={bulkDelete} className="admin-bulk-bar admin-bulk-bar--float">
          {selected.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <span>Выбрано: {selected.length}</span>
          <ConfirmSubmitButton message="Удалить выбранные новости?" className="btn btn-secondary" style={{ color: '#e11d48' }}>
            Удалить выбранные
          </ConfirmSubmitButton>
        </form>
      ) : null}
      <div className="admin-table-wrap admin-table-wrap--sticky">
        <table>
          <thead>
            <tr>
              <th>
                <input
                  type="checkbox"
                  checked={allOn}
                  onChange={(e) => {
                    const on = e.target.checked;
                    const next: Record<string, boolean> = {};
                    if (on) rows.forEach((r) => (next[r.id] = true));
                    setPicked(next);
                  }}
                  aria-label="Выделить все"
                />
              </th>
              <th>Заголовок</th>
              <th>Текст</th>
              <th>Статус</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((n) => (
              <tr key={n.id}>
                <td data-label="">
                  <input
                    type="checkbox"
                    checked={Boolean(picked[n.id])}
                    onChange={(e) => setPicked((p) => ({ ...p, [n.id]: e.target.checked }))}
                    aria-label="Выбрать новость"
                  />
                </td>
                <td data-label="Заголовок">{n.title || 'Без названия'}</td>
                <td data-label="Текст">
                  {(n.text || '').slice(0, 160)}
                  {(n.text || '').length > 160 ? '…' : ''}
                </td>
                <td data-label="Статус">{publishLabel(n.status, n.publishedAt || n.createdAt)}</td>
                <td data-label="Действия" className="actions-cell">
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <Link href={'/admin/news?edit=' + n.id} className="btn btn-secondary">
                      Изменить
                    </Link>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={n.id} />
                      <ConfirmSubmitButton message="Удалить новость?" className="btn btn-secondary" style={{ color: '#e11d48' }}>
                        <Trash2 size={16} />
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Новостей пока нет
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
