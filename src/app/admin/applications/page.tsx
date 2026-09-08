import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import { notifyApplicationStatus } from '@/lib/notifications';
import { promoteToParticipant } from '@/lib/participant';
import AdminFilterTabs from '@/components/admin/AdminFilterTabs';
import AdminFocusTarget from '@/components/admin/AdminFocusTarget';
import ApplicationsBoard, { serializeApp } from '@/components/admin/ApplicationsBoard';
import type { ApplicationStatus, Prisma } from '@prisma/client';

async function updateStatus(formData: FormData) {
  'use server';
  const session = await requirePermission('applications');
  const id = formData.get('id') as string;
  const statusRaw = formData.get('status') as string;
  if (statusRaw !== 'APPROVED' && statusRaw !== 'REJECTED') return;
  const status = statusRaw;
  const rejectReason =
    status === 'REJECTED'
      ? String(formData.get('rejectReason') || '')
          .trim()
          .slice(0, 1000)
      : null;
  if (status === 'REJECTED' && !rejectReason) return;

  try {
    const application = await prisma.$transaction(async (tx) => {
      const current = await tx.application.findUnique({
        where: { id },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
          project: true,
          club: true,
          program: true,
        },
      });
      if (!current || current.status !== 'PENDING') return null;
      return tx.application.update({
        where: { id, status: 'PENDING' },
        data: {
          status,
          rejectReason: status === 'REJECTED' ? rejectReason : null,
        },
        include: {
          user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
          project: true,
          club: true,
          program: true,
        },
      });
    });

    if (!application) return;

    if (status === 'APPROVED') {
      await promoteToParticipant(application.userId);
      const { evaluateAchievements } = await import('@/lib/award-achievements');
      await evaluateAchievements(application.userId).catch(() => null);
      if (application.program?.kind === 'GRANT') {
        const { bumpEcoPoints, ECO } = await import('@/lib/eco-points');
        await bumpEcoPoints(application.userId, ECO.APPLICATION_APPROVED || 8, 'grant_approved', {
          applicationId: application.id,
          programId: application.programId,
        }).catch(() => null);
      }
    }

    const targetName =
      application.project?.title ||
      application.club?.title ||
      application.program?.title ||
      'Программа';
    void notifyApplicationStatus({
      to: application.user?.email || null,
      userId: application.user.id,
      targetName,
      status,
      rejectReason: application.rejectReason,
    }).catch(() => null);

    void import('@/lib/moderation-outcome')
      .then(({ publishModerationOutcome }) =>
        publishModerationOutcome({
          kind: 'app',
          id: application.id,
          status,
          actorId: session.user.id,
          actorName: session.user.name || session.user.email || 'Админ',
          subject: targetName,
          rejectReason: application.rejectReason,
        })
      )
      .catch(() => null);

    revalidatePath('/admin/applications');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
  } catch (e) {
    console.error('Ошибка обновления', e);
  }
}

async function bulkApprove(formData: FormData) {
  'use server';
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  for (const id of ids) {
    const fd = new FormData();
    fd.set('id', id);
    fd.set('status', 'APPROVED');
    await updateStatus(fd);
  }
}

type Search = {
  page?: string;
  status?: string;
  type?: string;
  focus?: string;
  q?: string;
};

function buildHref(base: Search, patch: Partial<Search>) {
  const next = { ...base, ...patch };
  const p = new URLSearchParams();
  if (next.status) p.set('status', next.status);
  if (next.type && next.type !== 'all') p.set('type', next.type);
  if (next.q) p.set('q', next.q);
  if (next.focus) p.set('focus', next.focus);
  if (next.page && String(next.page) !== '1') p.set('page', String(next.page));
  const s = p.toString();
  return s ? `?${s}` : '?status=PENDING';
}

export default async function AdminApplications({ searchParams }: { searchParams: Promise<Search> }) {
  await requirePermissionPage('applications');
  const resolved = await searchParams;
  const statusParam = (resolved.status || 'PENDING').toUpperCase();
  const typeParam = (resolved.type || 'all').toLowerCase();
  const type =
    typeParam === 'project' ||
    typeParam === 'club' ||
    typeParam === 'program' ||
    typeParam === 'grant' ||
    typeParam === 'dobro' ||
    typeParam === 'self_gov'
      ? typeParam
      : 'all';
  const q = (resolved.q || '').trim();
  const focus = (resolved.focus || '').trim() || null;
  const page = Math.max(1, parseInt(resolved.page || '1', 10) || 1);
  const take = 20;
  const skip = (page - 1) * take;

  let status: ApplicationStatus | 'ALL' =
    statusParam === 'ALL' || statusParam === 'APPROVED' || statusParam === 'REJECTED' || statusParam === 'PENDING'
      ? (statusParam as ApplicationStatus | 'ALL')
      : 'PENDING';
  // Dashboard deep-link: open the status tab of the focused application
  if (focus && !resolved.status) {
    const focused = await prisma.application.findUnique({
      where: { id: focus },
      select: { status: true },
    });
    if (focused) status = focused.status;
  }

  const where: Prisma.ApplicationWhereInput = {};
  if (status !== 'ALL') where.status = status;
  if (type === 'project') where.projectId = { not: null };
  if (type === 'club') where.clubId = { not: null };
  if (type === 'program') where.programId = { not: null };
  if (type === 'grant') where.program = { kind: 'GRANT' };
  if (type === 'dobro') where.program = { kind: 'DOBRO' };
  if (type === 'self_gov') where.program = { kind: 'SELF_GOV' };
  if (q) {
    where.OR = [
      { message: { contains: q, mode: 'insensitive' } },
      { user: { name: { contains: q, mode: 'insensitive' } } },
      { user: { email: { contains: q, mode: 'insensitive' } } },
      { project: { title: { contains: q, mode: 'insensitive' } } },
      { club: { title: { contains: q, mode: 'insensitive' } } },
      { program: { title: { contains: q, mode: 'insensitive' } } },
    ];
  }

  const effectiveStatus = status;

  let applications: any[] = [];
  let total = 0;
  let counts = {
    PENDING: 0,
    APPROVED: 0,
    REJECTED: 0,
    all: 0,
    project: 0,
    club: 0,
    program: 0,
  };
  try {
    const [listTotal, list, byStatus, projectCount, clubCount, programCount] = await Promise.all([
      prisma.application.count({ where }),
      prisma.application.findMany({
        where,
        include: {
          project: true,
          club: true,
          program: true,
          user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
        },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      prisma.application.groupBy({ by: ['status'], _count: true }),
      prisma.application.count({ where: { projectId: { not: null } } }),
      prisma.application.count({ where: { clubId: { not: null } } }),
      prisma.application.count({ where: { programId: { not: null } } }),
    ]);
    total = listTotal;
    applications = list;
    for (const g of byStatus) {
      counts[g.status as 'PENDING' | 'APPROVED' | 'REJECTED'] = g._count;
      counts.all += g._count;
    }
    counts.project = projectCount;
    counts.club = clubCount;
    counts.program = programCount;
  } catch {
    applications = [];
  }

  const totalPages = Math.max(1, Math.ceil(total / take));
  const base: Search = {
    status: effectiveStatus,
    type,
    q: q || undefined,
    focus: focus || undefined,
  };

  return (
    <div className="admin-page-shell">
      <AdminFocusTarget id={focus ? `app-${focus}` : null} />
      <style>{`
        tr[data-focus-flash="1"] td { background: rgba(59,130,246,0.12) !important; transition: background 0.4s; }
      `}</style>
      <div className="admin-page-header">
        <div>
          <h1>Заявки</h1>
          <p>Клубы, проекты, программы · {total}</p>
        </div>
        <a href="/api/admin/export?type=applications" className="btn btn-primary">
          Экспорт CSV
        </a>
      </div>

      <AdminFilterTabs
        ariaLabel="Статус заявки"
        items={[
          {
            href: buildHref(base, { status: 'PENDING', page: '1', focus: undefined }),
            label: 'Ожидают',
            count: counts.PENDING,
            active: effectiveStatus === 'PENDING',
            tone: 'warning',
          },
          {
            href: buildHref(base, { status: 'APPROVED', page: '1', focus: undefined }),
            label: 'Одобрено',
            count: counts.APPROVED,
            active: effectiveStatus === 'APPROVED',
            tone: 'success',
          },
          {
            href: buildHref(base, { status: 'REJECTED', page: '1', focus: undefined }),
            label: 'Отклонено',
            count: counts.REJECTED,
            active: effectiveStatus === 'REJECTED',
            tone: 'danger',
          },
          {
            href: buildHref(base, { status: 'ALL', page: '1', focus: undefined }),
            label: 'Все',
            count: counts.all,
            active: effectiveStatus === 'ALL',
            tone: 'muted',
          },
        ]}
      />

      <AdminFilterTabs
        ariaLabel="Тип участия"
        items={[
          {
            href: buildHref(base, { type: 'all', page: '1', focus: undefined }),
            label: 'Все типы',
            active: type === 'all',
          },
          {
            href: buildHref(base, { type: 'project', page: '1', focus: undefined }),
            label: 'Проекты',
            count: counts.project,
            active: type === 'project',
          },
          {
            href: buildHref(base, { type: 'club', page: '1', focus: undefined }),
            label: 'Клубы',
            count: counts.club,
            active: type === 'club',
          },
          {
            href: buildHref(base, { type: 'program', page: '1', focus: undefined }),
            label: 'Программы',
            count: counts.program,
            active: type === 'program' || type === 'grant' || type === 'dobro' || type === 'self_gov',
          },
        ]}
      />

      <form method="GET" className="admin-search-row">
        <input type="hidden" name="status" value={effectiveStatus} />
        <input type="hidden" name="type" value={type} />
        <input name="q" defaultValue={q} placeholder="Имя, email, клуб…" className="settings-input" />
        <button type="submit" className="btn btn-secondary">
          Найти
        </button>
      </form>

      <div
        style={{
          backgroundColor: 'white',
          padding: '1rem',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <ApplicationsBoard
          rows={applications.map(serializeApp)}
          focusId={focus}
          updateStatus={updateStatus}
          bulkApprove={bulkApprove}
        />
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
          {page > 1 && (
            <Link
              href={buildHref(base, { page: String(page - 1) })}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
              prefetch
            >
              Назад
            </Link>
          )}
          <span style={{ padding: '0.5rem 1rem', fontWeight: 600 }}>
            Страница {page} из {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={buildHref(base, { page: String(page + 1) })}
              className="btn btn-secondary"
              style={{ padding: '0.5rem 1rem' }}
              prefetch
            >
              Вперёд
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
