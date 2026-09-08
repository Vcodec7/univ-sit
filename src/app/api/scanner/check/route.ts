import { rejectIfModuleDisabled } from '@/lib/require-module';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { canUseScanner } from '@/lib/acl';
import { runScannerCheck } from '@/lib/scanner-check';

export async function POST(req: Request) {
  {
    const blocked = await rejectIfModuleDisabled('tickets_scan');
    if (blocked) return blocked;
  }
  try {
    const session = await getServerSession(authOptions);
    const role = session?.user?.role;
    if (!session?.user?.id || !canUseScanner(role, session.user.permissions)) {
      return NextResponse.json({ message: 'Доступ только для сервисного сканера' }, { status: 403 });
    }

    const body = await req.json();
    const code = typeof body.code === 'string' ? body.code.trim() : '';
    const method = body.method === 'MANUAL' ? 'MANUAL' : 'QR';
    const expectedBookingId =
      typeof body.bookingId === 'string' && body.bookingId.trim() ? body.bookingId.trim() : null;

    const result = await runScannerCheck({
      code,
      method,
      expectedBookingId,
      scannedById: session.user.id,
    });
    return NextResponse.json(result.body, { status: result.http });
  } catch (e) {
    console.error('scanner check error', e);
    return NextResponse.json({ message: 'Ошибка сервера' }, { status: 500 });
  }
}

/** Live session stats for scanner UI */
export async function GET(req: Request) {
  {
    const blocked = await rejectIfModuleDisabled('tickets_scan');
    if (blocked) return blocked;
  }
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !canUseScanner(session.user.role, session.user.permissions)) {
      return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const bookingId = searchParams.get('bookingId');
    const since = new Date(Date.now() - 12 * 60 * 60 * 1000);

    const recent = await prisma.ticketCheckIn.findMany({
      where: {
        createdAt: { gte: since },
        ...(bookingId ? { bookingId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: 40,
      include: {
        user: { select: { name: true, phone: true } },
        booking: { select: { id: true, title: true, space: { select: { title: true } } } },
      },
    });

    const todayCount = await prisma.ticketCheckIn.count({
      where: {
        createdAt: { gte: since },
        ...(bookingId ? { bookingId } : {}),
      },
    });

    const byMethod = await prisma.ticketCheckIn.groupBy({
      by: ['method'],
      where: {
        createdAt: { gte: since },
        ...(bookingId ? { bookingId } : {}),
      },
      _count: { _all: true },
    });

    let eventStats: { checkedCount: number; registeredCount: number } | null = null;
    if (bookingId) {
      const checkedCount = await prisma.ticketCheckIn.count({ where: { bookingId } });
      const registeredCount =
        (await prisma.bookingParticipant.count({ where: { bookingId } })) + 1;
      eventStats = { checkedCount, registeredCount };
    }

    return NextResponse.json({
      todayCount,
      recent: recent.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
        method: r.method,
        scannedById: r.scannedById,
        user: r.user,
        booking: r.booking,
      })),
      byMethod: Object.fromEntries(byMethod.map((m) => [m.method, m._count._all])),
      eventStats,
      serverTime: new Date().toISOString(),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ message: 'Ошибка' }, { status: 500 });
  }
}
