'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Check, Users } from 'lucide-react';
import AdminPendingButton from '@/components/admin/AdminPendingButton';
import RejectWithReasonForm from '@/components/admin/RejectWithReasonForm';

export type BookingRow = {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  status: string;
  rejectReason: string | null;
  startLabel: string;
  spaceTitle: string;
  organizer: string;
  participantCount: number;
};

export default function BookingsBoard({
  rows,
  hrefFor,
  updateStatus,
  bulkApprove,
}: {
  rows: BookingRow[];
  hrefFor: (opts: { view?: string }) => string;
  updateStatus: (formData: FormData) => void | Promise<void>;
  bulkApprove: (formData: FormData) => void | Promise<void>;
}) {
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const pendingIds = useMemo(() => rows.filter((r) => r.status === 'PENDING').map((r) => r.id), [rows]);
  const selected = pendingIds.filter((id) => picked[id]);
  const allOn = pendingIds.length > 0 && pendingIds.every((id) => picked[id]);

  return (
    <>
      {pendingIds.length > 0 ? (
        <form action={bulkApprove} className="admin-bulk-bar admin-bulk-bar--float">
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
            Выделить ожидающие
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
              <th>В афише</th>
              <th>Организатор</th>
              <th>Время и место</th>
              <th>Участники</th>
              <th>Статус</th>
              <th>Решение</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((booking) => (
              <tr key={booking.id}>
                <td data-label="">
                  {booking.status === 'PENDING' ? (
                    <input
                      type="checkbox"
                      checked={Boolean(picked[booking.id])}
                      onChange={(e) => setPicked((p) => ({ ...p, [booking.id]: e.target.checked }))}
                      aria-label="Выбрать бронь"
                    />
                  ) : null}
                </td>
                <td data-label="В афише">
                  {booking.title}
                  <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{booking.description}</div>
                </td>
                <td data-label="Организатор">{booking.organizer}</td>
                <td data-label="Время и место">
                  <div style={{ fontWeight: 500 }}>{booking.spaceTitle}</div>
                  <div style={{ fontSize: '0.85rem' }}>{booking.startLabel}</div>
                </td>
                <td data-label="Участники">
                  {booking.participantCount > 0 ? (
                    <Link href={hrefFor({ view: booking.id })}>
                      <Users size={16} /> {booking.participantCount}
                    </Link>
                  ) : (
                    <span style={{ color: 'var(--muted)' }}>Нет</span>
                  )}
                </td>
                <td data-label="Статус">
                  {booking.status === 'PENDING' ? 'Ожидает' : booking.status === 'APPROVED' ? 'Одобрено' : 'Отклонено'}
                </td>
                <td data-label="Решение" className="actions-cell">
                  {booking.status === 'PENDING' ? (
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <form action={updateStatus}>
                        <input type="hidden" name="id" value={booking.id} />
                        <input type="hidden" name="status" value="APPROVED" />
                        <AdminPendingButton className="btn btn-secondary" title="Одобрить" pendingLabel="…">
                          <Check size={16} />
                        </AdminPendingButton>
                      </form>
                      <RejectWithReasonForm action={updateStatus} id={booking.id} />
                    </div>
                  ) : null}
                  {booking.status === 'REJECTED' && booking.rejectReason ? (
                    <p style={{ margin: 0, fontSize: '0.8rem', color: '#991b1b' }}>{booking.rejectReason}</p>
                  ) : null}
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Нет заявок в этом фильтре
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
