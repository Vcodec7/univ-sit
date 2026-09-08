'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Eye, Trash2 } from 'lucide-react';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import RoleEditor from '@/components/RoleEditor';
import UserBlockControls from '@/components/admin/UserBlockControls';
import AdminSlideover from '@/components/admin/AdminSlideover';
import { roleLabelRu } from '@/lib/role-labels';

export type UserRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: string;
  permissions: string | null;
  reliabilityScore: number | null;
  attendedCount: number | null;
  noShowCount: number | null;
  blockedAt: string | null;
  blockedReason: string | null;
  suspiciousFlag: boolean;
};

export default function UsersBoard({
  rows,
  deleteUser,
  bulkDelete,
  bulkBlock,
}: {
  rows: UserRow[];
  deleteUser: (formData: FormData) => void | Promise<void>;
  bulkDelete: (formData: FormData) => void | Promise<void>;
  bulkBlock: (formData: FormData) => void | Promise<void>;
}) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const open = rows.find((r) => r.id === openId) || null;
  const selected = useMemo(() => rows.filter((r) => picked[r.id]).map((r) => r.id), [rows, picked]);
  const allOn = rows.length > 0 && rows.every((r) => picked[r.id]);

  return (
    <>
      {selected.length > 0 ? (
        <div className="admin-bulk-bar admin-bulk-bar--float">
          <span>Выбрано: {selected.length}</span>
          <form action={bulkBlock}>
            {selected.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <ConfirmSubmitButton
              message="Заблокировать выбранных пользователей? Причина: нарушение правил."
              className="btn btn-secondary"
            >
              Заблокировать выбранных
            </ConfirmSubmitButton>
          </form>
          <form action={bulkDelete}>
            {selected.map((id) => (
              <input key={id} type="hidden" name="ids" value={id} />
            ))}
            <ConfirmSubmitButton
              message="Удалить выбранных пользователей? Это необратимо."
              className="btn btn-secondary"
              style={{ color: '#b91c1c' }}
            >
              Удалить выбранных
            </ConfirmSubmitButton>
          </form>
        </div>
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
                  aria-label="Выделить всех на странице"
                />
              </th>
              <th>Имя</th>
              <th>Контакты</th>
              <th>Рейтинг</th>
              <th>Роль</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((user) => (
              <tr key={user.id} onClick={() => setOpenId(user.id)}>
                <td data-label="" onClick={(e) => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={Boolean(picked[user.id])}
                    onChange={(e) => setPicked((p) => ({ ...p, [user.id]: e.target.checked }))}
                    aria-label="Выбрать пользователя"
                  />
                </td>
                <td data-label="Имя">
                  {user.name || 'Без имени'}
                  {user.blockedAt ? (
                    <span className="admin-status-pill is-INACTIVE" style={{ marginLeft: 8 }}>
                      Блок
                    </span>
                  ) : null}
                </td>
                <td data-label="Контакты">
                  <div>{user.email || 'Нет email'}</div>
                  <div style={{ fontSize: '0.8rem' }}>{user.phone || 'Нет телефона'}</div>
                </td>
                <td data-label="Рейтинг">
                  <div style={{ fontWeight: 700 }}>{user.reliabilityScore ?? 100}%</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--muted)' }}>
                    ✓{user.attendedCount ?? 0} · ✗{user.noShowCount ?? 0}
                  </div>
                </td>
                <td data-label="Роль">{roleLabelRu(user.role)}</td>
                <td data-label="Действия" className="actions-cell" onClick={(e) => e.stopPropagation()}>
                  <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Link href={`/admin/users/${user.id}`} className="btn btn-secondary" style={{ padding: '0.5rem' }}>
                      <Eye size={16} />
                    </Link>
                    <form action={deleteUser}>
                      <input type="hidden" name="id" value={user.id} />
                      <ConfirmSubmitButton
                        message="Удалить пользователя? Это необратимо."
                        className="btn btn-secondary"
                        style={{ padding: '0.5rem', color: 'var(--accent)' }}
                      >
                        <Trash2 size={16} />
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {rows.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Ничего не найдено
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      {open ? (
        <AdminSlideover
          titleId="user-slide-title"
          title={open.name || 'Без имени'}
          kicker={roleLabelRu(open.role)}
          subtitle={open.email || open.phone || ''}
          onClose={() => setOpenId(null)}
          footer={
            <Link href={`/admin/users/${open.id}`} className="btn btn-primary">
              Полный профиль
            </Link>
          }
        >
          <p>
            <strong>Рейтинг:</strong> {open.reliabilityScore ?? 100}%
          </p>
          <RoleEditor user={{ id: open.id, role: open.role, permissions: open.permissions }} />
          <div style={{ marginTop: '1rem' }}>
            <UserBlockControls
              userId={open.id}
              blockedAt={open.blockedAt}
              blockedReason={open.blockedReason}
              suspiciousFlag={open.suspiciousFlag}
            />
          </div>
        </AdminSlideover>
      ) : null}
    </>
  );
}
