'use client';

import { useMemo, useState } from 'react';
import { Check, X } from 'lucide-react';
import AdminPendingButton from '@/components/admin/AdminPendingButton';
import RejectWithReasonForm from '@/components/admin/RejectWithReasonForm';

export type AppRow = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  message: string | null;
  rejectReason: string | null;
  createdAt: string;
  typeLabel: string;
  title: string;
  userName: string;
  userEmail: string | null;
};

function typeLabel(app: {
  project?: { title?: string | null } | null;
  club?: { title?: string | null } | null;
  program?: { title?: string | null; kind?: string | null } | null;
}) {
  if (app.project) return 'Проект';
  if (app.club) return 'Клуб';
  if (app.program?.kind === 'GRANT') return 'Грант';
  if (app.program?.kind === 'DOBRO') return 'Добро';
  if (app.program?.kind === 'SELF_GOV') return 'Самоупр.';
  if (app.program) return 'Программа';
  return 'Заявка';
}

export function serializeApp(app: any): AppRow {
  return {
    id: app.id,
    status: app.status,
    message: app.message || null,
    rejectReason: app.rejectReason || null,
    createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : '',
    typeLabel: typeLabel(app),
    title: app.project?.title || app.club?.title || app.program?.title || '—',
    userName: app.user?.name || app.user?.email || '—',
    userEmail: app.user?.email || null,
  };
}

export default function ApplicationsBoard({
  rows,
  focusId,
  updateStatus,
  bulkApprove,
}: {
  rows: AppRow[];
  focusId?: string | null;
  updateStatus: (formData: FormData) => void | Promise<void>;
  bulkApprove: (formData: FormData) => void | Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(focusId || null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const open = rows.find((r) => r.id === openId) || null;
  const pendingIds = useMemo(() => rows.filter((r) => r.status === 'PENDING').map((r) => r.id), [rows]);
  const selected = pendingIds.filter((id) => picked[id]);
  const allOn = pendingIds.length > 0 && pendingIds.every((id) => picked[id]);

  const statusRu = (s: string) => (s === 'PENDING' ? 'Ожидает' : s === 'APPROVED' ? 'Одобрено' : 'Отклонено');

  return (
    <>
      {pendingIds.length > 0 ? (
        <form action={bulkApprove} className="admin-bulk-bar">
          {selected.map((id) => (
            <input key={id} type="hidden" name="ids" value={id} />
          ))}
          <label>
            <input
              type="checkbox"
              checked={allOn}
              onChange={(e) => {
                const on = e.target.checked;
                const next: Record<string, boolean> = {};
                if (on) pendingIds.forEach((id) => (next[id] = true));
                setPicked(next);
              }}
            />{' '}
            Выделить все на странице
          </label>
          <button type="submit" className="btn btn-primary" disabled={selected.length === 0}>
            Одобрить выбранных ({selected.length})
          </button>
        </form>
      ) : null}

      <div className="admin-table-wrap admin-table-wrap--sticky">
        <table>
          <thead>
            <tr>
              <th>
                <span className="sr-only">Выбор</span>
              </th>
              <th>Тип</th>
              <th>Название</th>
              <th>Пользователь</th>
              <th>Сообщение</th>
              <th>Статус</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((app) => (
              <tr
                key={app.id}
                id={`app-${app.id}`}
                className={focusId === app.id ? 'is-focus' : ''}
                onClick={() => setOpenId(app.id)}
              >
                <td data-label="" onClick={(e) => e.stopPropagation()}>
                  {app.status === 'PENDING' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(picked[app.id])}
                      onChange={(e) => setPicked((p) => ({ ...p, [app.id]: e.target.checked }))}
                      aria-label="Выбрать заявку"
                    />
                  ) : null}
                </td>
                <td data-label="Тип">{app.typeLabel}</td>
                <td data-label="Название">{app.title}</td>
                <td data-label="Пользователь">{app.userName}</td>
                <td data-label="Сообщение">{app.message || '—'}</td>
                <td data-label="Статус">
                  <span
                    className={`admin-status-pill is-${app.status === 'PENDING' ? 'REVIEW' : app.status === 'APPROVED' ? 'ACTIVE' : 'INACTIVE'}`}
                  >
                    {statusRu(app.status)}
                  </span>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Нет заявок в этом фильтре
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <div className="admin-slideover" role="dialog" aria-modal="true" aria-labelledby="app-slide-title">
          <button type="button" className="admin-slideover__backdrop" aria-label="Закрыть" onClick={() => setOpenId(null)} />
          <aside className="admin-slideover__panel">
            <header className="admin-slideover__head">
              <div>
                <p className="admin-slideover__kicker">{open.typeLabel}</p>
                <h2 id="app-slide-title">{open.title}</h2>
                <p>{open.userName}</p>
              </div>
              <button type="button" className="yp-modal-close" onClick={() => setOpenId(null)} aria-label="Закрыть">
                <X size={18} />
              </button>
            </header>
            <div className="admin-slideover__body">
              <p>
                <strong>Статус:</strong> {statusRu(open.status)}
              </p>
              {open.message ? <p style={{ whiteSpace: 'pre-wrap' }}>{open.message}</p> : <p>Без сопроводительного текста</p>}
              {open.rejectReason ? <p style={{ color: '#991b1b' }}>{open.rejectReason}</p> : null}
            </div>
            {open.status === 'PENDING' ? (
              <footer className="admin-slideover__foot">
                <form action={updateStatus}>
                  <input type="hidden" name="id" value={open.id} />
                  <input type="hidden" name="status" value="APPROVED" />
                  <AdminPendingButton className="btn btn-primary" pendingLabel="…">
                    <Check size={16} /> Одобрить
                  </AdminPendingButton>
                </form>
                <RejectWithReasonForm action={updateStatus} id={open.id} />
              </footer>
            ) : null}
          </aside>
        </div>
      ) : null}
    </>
  );
}
