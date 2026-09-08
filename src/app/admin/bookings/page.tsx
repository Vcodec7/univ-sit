import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { X as XIcon } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import { notifyBookingStatus, notifyBookingCancelledToGuests } from '@/lib/notifications';
import { promoteToParticipant } from '@/lib/participant';
import { formatMskDate, formatMskTimeRange } from '@/lib/booking-hours';
import AdminFilterTabs from '@/components/admin/AdminFilterTabs';
import BookingsBoard, { type BookingRow } from '@/components/admin/BookingsBoard';
import type { Prisma } from '@prisma/client';

async function updateStatus(formData: FormData) {
  'use server';
  const session = await requirePermission('bookings');
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
    const booking = await prisma.$transaction(async (tx) => {
      const current = await tx.booking.findUnique({
        where: { id },
        include: {
          space: true,
          user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
        },
      });
      if (!current || current.status !== 'PENDING') return null;

      if (status === 'APPROVED') {
        const overlap = await tx.booking.findFirst({
          where: {
            spaceId: current.spaceId,
            status: 'APPROVED',
            id: { not: current.id },
            startTime: { lt: current.endTime },
            endTime: { gt: current.startTime },
          },
        });
        if (overlap) throw new Error('OVERBOOK');
      }

      return tx.booking.update({
        where: { id, status: 'PENDING' },
        data: {
          status,
          rejectReason: status === 'REJECTED' ? rejectReason : null,
        },
        include: {
          space: true,
          user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
        },
      });
    });

    if (!booking) return;

    if (status === 'APPROVED') {
      await promoteToParticipant(booking.userId);
    }

    if (booking.user?.email) {
      void notifyBookingStatus({
        to: booking.user.email,
        userId: booking.userId,
        bookingId: booking.id,
        title: booking.title,
        spaceTitle: booking.space?.title,
        spaceAddress: booking.space?.address,
        startTime: booking.startTime,
        endTime: booking.endTime,
        status,
        rejectReason: booking.rejectReason,
      }).catch(() => null);
    }
    if (status === 'REJECTED') {
      void notifyBookingCancelledToGuests(booking.id, booking.rejectReason || 'Администрация отменила мероприятие').catch(
        () => null
      );
    }

    void import('@/lib/moderation-outcome')
      .then(({ publishModerationOutcome }) =>
        publishModerationOutcome({
          kind: 'book',
          id: booking.id,
          status,
          actorId: session.user.id,
          actorName: session.user.name || session.user.email || 'Админ',
          subject: booking.title,
          rejectReason: booking.rejectReason,
        })
      )
      .catch(() => null);

    revalidatePath('/admin/bookings');
    revalidatePath('/admin');
    revalidatePath('/dashboard');
    revalidatePath('/events');
    revalidatePath('/');
  } catch (e: any) {
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

type Search = { view?: string; tab?: string; status?: string };

function hrefFor(opts: { tab?: string; status?: string; view?: string | null }) {
  const p = new URLSearchParams();
  if (opts.tab === 'archive') p.set('tab', 'archive');
  const status = opts.status || 'PENDING';
  p.set('status', status);
  if (opts.view) p.set('view', opts.view);
  return `?${p.toString()}`;
}

export default async function AdminBookings({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; tab?: string; status?: string }>;
}) {
  await requirePermissionPage('bookings');
  const resolvedParams = await searchParams;
  const viewId = resolvedParams.view || null;
  const activeTab = resolvedParams.tab === 'archive' ? 'archive' : 'active';
  const statusRaw = (resolvedParams.status || 'PENDING').toUpperCase();
  const statusFilter =
    statusRaw === 'ALL' || statusRaw === 'APPROVED' || statusRaw === 'REJECTED' || statusRaw === 'PENDING'
      ? statusRaw
      : 'PENDING';

  const now = new Date();
  const where: Prisma.BookingWhereInput = {};
  if (statusFilter !== 'ALL') where.status = statusFilter;
  if (activeTab === 'archive') {
    where.endTime = { lt: now };
  } else {
    where.endTime = { gte: now };
  }

  let bookings: any[] = [];
  let counts = { PENDING: 0, APPROVED: 0, REJECTED: 0, all: 0 };
  try {
    const timeWhere: Prisma.BookingWhereInput =
      activeTab === 'archive' ? { endTime: { lt: now } } : { endTime: { gte: now } };

    const [list, byStatus] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          space: true,
          user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
          participants: {
            include: { user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 200,
      }),
      prisma.booking.groupBy({
        by: ['status'],
        where: timeWhere,
        _count: true,
      }),
    ]);
    bookings = list;
    for (const g of byStatus) {
      counts[g.status as 'PENDING' | 'APPROVED' | 'REJECTED'] = g._count;
      counts.all += g._count;
    }
  } catch {
    bookings = [];
  }

  // Modal can open from another filter — fetch targeted booking if missing
  let viewedBooking = viewId ? bookings.find((b) => b.id === viewId) : null;
  if (viewId && !viewedBooking) {
    viewedBooking = await prisma.booking.findUnique({
      where: { id: viewId },
      include: {
        space: true,
        user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } },
        participants: {
          include: { user: { select: { id: true, name: true, email: true, phone: true, image: true, role: true } } },
        },
      },
    });
  }

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '6rem' }}>
      <div className="admin-page-header">
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.25rem' }}>
            Афиша
          </h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            Брони пространств = мероприятия афиши (после одобрения). В списке: {bookings.length}
          </p>
        </div>
        <Link href="/scanner" className="btn btn-secondary" style={{ padding: '0.55rem 1.1rem', fontWeight: 700 }}>
          Открыть сканер
        </Link>
      </div>

      <AdminFilterTabs
        ariaLabel="Период"
        items={[
          {
            href: hrefFor({ tab: 'active', status: statusFilter }),
            label: 'Актуальные',
            active: activeTab === 'active',
          },
          {
            href: hrefFor({ tab: 'archive', status: statusFilter }),
            label: 'Архив',
            active: activeTab === 'archive',
            tone: 'muted',
          },
        ]}
      />

      <AdminFilterTabs
        ariaLabel="Статус брони"
        items={[
          {
            href: hrefFor({ tab: activeTab, status: 'PENDING' }),
            label: 'Ожидают',
            count: counts.PENDING,
            active: statusFilter === 'PENDING',
            tone: 'warning',
          },
          {
            href: hrefFor({ tab: activeTab, status: 'APPROVED' }),
            label: 'Одобрено',
            count: counts.APPROVED,
            active: statusFilter === 'APPROVED',
            tone: 'success',
          },
          {
            href: hrefFor({ tab: activeTab, status: 'REJECTED' }),
            label: 'Отклонено',
            count: counts.REJECTED,
            active: statusFilter === 'REJECTED',
            tone: 'danger',
          },
          {
            href: hrefFor({ tab: activeTab, status: 'ALL' }),
            label: 'Все',
            count: counts.all,
            active: statusFilter === 'ALL',
            tone: 'muted',
          },
        ]}
      />

      <BookingsBoard
        rows={bookings.map(
          (booking): BookingRow => ({
            id: booking.id,
            title: booking.title,
            description: booking.description,
            category: (booking as { category?: string }).category || null,
            status: booking.status,
            rejectReason: booking.rejectReason || null,
            startLabel: `${formatMskDate(booking.startTime, { day: 'numeric', month: 'short', year: 'numeric' })} ${formatMskTimeRange(booking.startTime, booking.endTime)} (МСК)`,
            spaceTitle: booking.space?.title || '—',
            organizer: booking.user?.name || booking.user?.email || '—',
            participantCount: booking.participants?.length || 0,
          })
        )}
        hrefFor={(opts) => hrefFor({ tab: activeTab, status: statusFilter, view: opts.view })}
        updateStatus={updateStatus}
        bulkApprove={bulkApprove}
      />

      {viewedBooking && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Участники мероприятия</h3>
              <Link
                href={hrefFor({ tab: activeTab, status: statusFilter, view: null })}
                className="yp-modal-close"
                aria-label="Закрыть"
              >
                <XIcon size={18} />
              </Link>
            </div>
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ fontWeight: 600, fontSize: '1.1rem' }}>{viewedBooking.title}</div>
              <div style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
                Вместимость: {viewedBooking.space?.capacity} чел. Записалось:{' '}
                {viewedBooking.participants?.length || 0} чел.
              </div>
            </div>

            {viewedBooking.participants?.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {viewedBooking.participants.map((p: any) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '0.75rem',
                      border: '1px solid #e2e8f0',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>{p.user?.name || 'Без имени'}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>{p.user?.email}</div>
                    </div>
                    {p.user?.phone && (
                      <div style={{ fontSize: '0.85rem', color: 'var(--foreground)' }}>{p.user.phone}</div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p style={{ color: 'var(--muted)', textAlign: 'center', padding: '2rem 0' }}>Пока никто не записался.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
