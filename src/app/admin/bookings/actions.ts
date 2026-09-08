'use server';

import { prisma } from '@/lib/prisma';
import { revalidatePath } from 'next/cache';
import { requirePermission } from '@/lib/acl';
import { notifyBookingStatus, notifyBookingCancelledToGuests } from '@/lib/notifications';
import { promoteToParticipant } from '@/lib/participant';

export async function updateBookingStatus(formData: FormData) {
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
  } catch (e) {
    console.error('Ошибка обновления', e);
  }
}

export async function bulkApproveBookings(formData: FormData) {
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  for (const id of ids) {
    const fd = new FormData();
    fd.set('id', id);
    fd.set('status', 'APPROVED');
    await updateBookingStatus(fd);
  }
}
