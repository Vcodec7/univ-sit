import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { requireAdmin, requireAdminPage } from '@/lib/acl';
import AdminFilterTabs from '@/components/admin/AdminFilterTabs';
import UsersBoard, { type UserRow } from '@/components/admin/UsersBoard';
import { formatBanReasons } from '@/lib/ban-reasons';
import { logAdminAction } from '@/lib/admin-audit';

async function deleteUser(formData: FormData) {
  'use server';
  const session = await requireAdmin();
  const id = formData.get('id') as string;
  try {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
    if (!target) return;
    if (target.role === 'TECH') {
      throw new Error('Нельзя удалить техучётку');
    }
    if (target.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw new Error('Нельзя удалить последнего администратора');
      }
    }
    if (id === session.user.id) {
      throw new Error('Нельзя удалить собственный аккаунт');
    }
    await prisma.user.delete({ where: { id } });
    revalidatePath('/admin/users');
  } catch (e) {
    console.error('Ошибка удаления', e);
  }
}


async function bulkDeleteUsers(formData: FormData) {
  'use server';
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  for (const id of ids) {
    const fd = new FormData();
    fd.set('id', id);
    await deleteUser(fd);
  }
}

async function bulkBlockUsers(formData: FormData) {
  'use server';
  const session = await requireAdmin();
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  const reasonCodes = ['RULES'];
  const reasonText = formatBanReasons(reasonCodes, 'Массовая блокировка из списка');
  for (const id of ids) {
    const target = await prisma.user.findUnique({
      where: { id },
      select: { id: true, email: true, name: true, role: true },
    });
    if (!target || target.role === 'TECH' || target.role === 'ADMIN') continue;
    if (id === session.user.id) continue;
    await prisma.user.update({
      where: { id },
      data: {
        blockedAt: new Date(),
        blockedReason: reasonText,
        tokenVersion: { increment: 1 },
        suspiciousFlag: true,
      },
    });
    await prisma.userBlockEvent.create({
      data: {
        userId: id,
        action: 'BLOCK',
        reasonsJson: JSON.stringify(reasonCodes),
        comment: 'Массовая блокировка из списка',
        actorId: session.user.id,
        actorName: session.user.name || session.user.email || 'Админ',
      },
    });
    await logAdminAction({
      actorId: session.user.id,
      actorEmail: session.user.email,
      actorRole: session.user.role,
      action: 'USER_BLOCK',
      targetType: 'User',
      targetId: target.id,
      targetEmail: target.email,
      detail: { reasonCodes, bulk: true },
    });
  }
  revalidatePath('/admin/users');
}

export default async function AdminUsers({ searchParams }: { searchParams: Promise<{ page?: string; q?: string; role?: string }> }) {
  await requireAdminPage();
  const resolvedParams = await searchParams;
  const page = parseInt(resolvedParams.page || '1', 10);
  const q = (resolvedParams.q || '').trim();
  const roleFilter = (resolvedParams.role || '').trim();
  const take = 20;
  const skip = (page - 1) * take;

  const where: any = { role: { not: 'TECH' } };
  if (q) {
    where.OR = [
      { name: { contains: q } },
      { email: { contains: q } },
      { phone: { contains: q } },
    ];
  }
  if (roleFilter === 'USER') {
    where.role = { in: ['USER', 'PARTICIPANT'] };
  } else if (roleFilter && ['MODERATOR', 'ADMIN', 'SCANNER'].includes(roleFilter)) {
    where.role = roleFilter;
  }

  let users: any[] = [];
  let total = 0;
  try {
    total = await prisma.user.count({ where });
    users = await prisma.user.findMany({
      where,
      select: { id: true, name: true, email: true, phone: true, image: true, role: true, permissions: true, reliabilityScore: true, attendedCount: true, noShowCount: true, createdAt: true, blockedAt: true, blockedReason: true, suspiciousFlag: true },
      orderBy: { createdAt: 'desc' },
      take,
      skip
    });
  } catch (e) {
    users = [];
  }
  const totalPages = Math.max(1, Math.ceil(total / take));

  let roleCounts: Record<string, number> = { ALL: 0 };
  try {
    const grouped = await prisma.user.groupBy({ by: ['role'], _count: true });
    for (const g of grouped) {
      if (g.role === 'TECH') continue;
      roleCounts[g.role] = g._count;
      roleCounts.ALL += g._count;
    }
  } catch {
    /* ignore */
  }

  const qs = (extra: Record<string, string | number>) => {
    const p = new URLSearchParams();
    if (q) p.set('q', q);
    if (roleFilter) p.set('role', roleFilter);
    Object.entries(extra).forEach(([k, v]) => {
      if (v === '' || v == null) p.delete(k);
      else p.set(k, String(v));
    });
    const s = p.toString();
    return s ? `?${s}` : '';
  };

  const roleTab = (role: string, label: string) => ({
    href: qs({ role: role === 'ALL' ? '' : role, page: 1 }),
    label,
    count: roleCounts[role === 'ALL' ? 'ALL' : role] || 0,
    active: role === 'ALL' ? !roleFilter : roleFilter === role,
  });

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '6rem' }}>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Пользователи
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            Найдено: {total}. Управление зарегистрированными аккаунтами
          </p>
        </div>
      </div>

      <AdminFilterTabs
        ariaLabel="Роль / тип участия"
        items={[
          roleTab('ALL', 'Все'),
          roleTab('USER', 'Пользователи'),
          roleTab('MODERATOR', 'Модераторы'),
          roleTab('ADMIN', 'Администраторы'),
          roleTab('SCANNER', 'Сканеры'),
        ]}
      />

      <form method="GET" className="card-surface" style={{ padding: '0.85rem 1rem', marginBottom: '1rem', display: 'flex', flexWrap: 'wrap', gap: '0.65rem', alignItems: 'center' }}>
        <input
          name="q"
          defaultValue={q}
          placeholder="Поиск: имя, email, телефон"
          className="settings-input"
          style={{ flex: '1 1 220px', minWidth: 0, margin: 0 }}
        />
        {roleFilter && <input type="hidden" name="role" value={roleFilter} />}
        <button type="submit" className="btn btn-primary" style={{ padding: '0.55rem 1.1rem' }}>Найти</button>
        {(q || roleFilter) && (
          <Link href="/admin/users" className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem' }} prefetch>Сбросить</Link>
        )}
      </form>

      <UsersBoard
        rows={users.map(
          (user): UserRow => ({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            role: user.role,
            permissions: user.permissions,
            reliabilityScore: user.reliabilityScore,
            attendedCount: user.attendedCount,
            noShowCount: user.noShowCount,
            blockedAt: user.blockedAt ? user.blockedAt.toISOString() : null,
            blockedReason: user.blockedReason,
            suspiciousFlag: Boolean(user.suspiciousFlag),
          })
        )}
        deleteUser={deleteUser}
        bulkDelete={bulkDeleteUsers}
        bulkBlock={bulkBlockUsers}
      />

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {page > 1 && (
            <Link href={qs({ page: page - 1 })} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Назад</Link>
          )}
          <span style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>Страница {page} из {totalPages}</span>
          {page < totalPages && (
            <Link href={qs({ page: page + 1 })} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Вперед</Link>
          )}
        </div>
      )}
    </div>
  );
}
