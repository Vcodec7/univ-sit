import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/csrf-origin';
import { aclJsonError, requireEndUser } from '@/lib/acl';
import { activeSignupStatuses, groupApprovedCount, groupSeatsLeft } from '@/lib/coworking';
import {
  findGroupByToken,
  groupInclude,
  serializeCoworkingGroup,
  type GroupSignupRow,
} from '@/lib/coworking-group';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const originBlock = assertSameOrigin(req);
  if (originBlock) return originBlock;

  let session;
  try {
    session = await requireEndUser();
  } catch (e) {
    return aclJsonError(e);
  }

  const body = await req.json().catch(() => null);
  const token = String(body?.token || '').trim();
  const row = await findGroupByToken(token);
  if (!row || row.status !== 'CONFIRMED') {
    return NextResponse.json({ message: 'Группа не найдена' }, { status: 404 });
  }
  if (row.userId === session.user.id) {
    return NextResponse.json({
      ok: true,
      group: serializeCoworkingGroup(row as GroupSignupRow, session.user.id),
    });
  }

  const existing = row.members.find((m) => m.userId === session.user.id);
  if (existing?.status === 'APPROVED') {
    return NextResponse.json({
      ok: true,
      group: serializeCoworkingGroup(row as GroupSignupRow, session.user.id),
    });
  }

  const overlap = await prisma.coworkingSignup.findFirst({
    where: {
      status: { in: [...activeSignupStatuses()] },
      startTime: { lt: row.endTime },
      endTime: { gt: row.startTime },
      OR: [
        { userId: session.user.id },
        { members: { some: { userId: session.user.id, status: 'APPROVED' } } },
      ],
    },
    select: { id: true },
  });
  if (overlap && overlap.id !== row.id) {
    return NextResponse.json({ message: 'У вас уже есть запись на это время' }, { status: 409 });
  }

  const approved = groupApprovedCount(row.members);
  const left = groupSeatsLeft(row.seats, approved);
  if (left <= 0) {
    return NextResponse.json({ message: 'Группа заполнена', code: 'FULL' }, { status: 409 });
  }

  const status = row.joinOpen ? 'APPROVED' : 'PENDING';
  await prisma.coworkingGroupMember.upsert({
    where: { signupId_userId: { signupId: row.id, userId: session.user.id } },
    create: {
      signupId: row.id,
      userId: session.user.id,
      role: 'MEMBER',
      status,
    },
    update: { status: row.joinOpen ? 'APPROVED' : (existing?.status || 'PENDING') },
  });

  const next = await prisma.coworkingSignup.findFirst({
    where: { id: row.id },
    include: groupInclude(),
  });
  return NextResponse.json({
    ok: true,
    group: serializeCoworkingGroup(next as GroupSignupRow, session.user.id),
  });
}
