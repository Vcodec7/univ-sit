import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/csrf-origin';
import { aclJsonError, requireEndUser, requireUser } from '@/lib/acl';
import { groupApprovedCount, groupSeatsLeft } from '@/lib/coworking';
import {
  findGroupByToken,
  groupInclude,
  serializeCoworkingGroup,
  type GroupSignupRow,
} from '@/lib/coworking-group';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = String(url.searchParams.get('token') || '').trim();
  const id = String(url.searchParams.get('id') || '').trim();
  if (!token && !id) {
    return NextResponse.json({ message: 'Укажите группу' }, { status: 400 });
  }

  let viewerId: string | null = null;
  try {
    const session = await requireUser();
    viewerId = session.user.id;
  } catch {
    viewerId = null;
  }

  const row = token
    ? await findGroupByToken(token)
    : await prisma.coworkingSignup.findFirst({
        where: { id, kind: 'GROUP' },
        include: groupInclude(),
      });

  if (!row) return NextResponse.json({ message: 'Группа не найдена' }, { status: 404 });
  return NextResponse.json({ group: serializeCoworkingGroup(row as GroupSignupRow, viewerId) });
}

export async function PATCH(req: Request) {
  const originBlock = assertSameOrigin(req);
  if (originBlock) return originBlock;

  let session;
  try {
    session = await requireEndUser();
  } catch (e) {
    return aclJsonError(e);
  }

  const body = await req.json().catch(() => null);
  const signupId = String(body?.signupId || body?.id || '');
  if (!signupId) return NextResponse.json({ message: 'Нет id группы' }, { status: 400 });

  const row = await prisma.coworkingSignup.findFirst({
    where: { id: signupId, kind: 'GROUP' },
    include: groupInclude(),
  });
  if (!row || row.userId !== session.user.id) {
    return NextResponse.json({ message: 'Группа не найдена' }, { status: 404 });
  }

  if (typeof body?.joinOpen === 'boolean') {
    await prisma.coworkingSignup.update({
      where: { id: row.id },
      data: { joinOpen: body.joinOpen },
    });
  }

  const acceptUserId = body?.acceptUserId ? String(body.acceptUserId) : '';
  if (acceptUserId) {
    const approved = groupApprovedCount(row.members);
    if (groupSeatsLeft(row.seats, approved) <= 0) {
      return NextResponse.json({ message: 'Группа заполнена' }, { status: 409 });
    }
    await prisma.coworkingGroupMember.updateMany({
      where: { signupId: row.id, userId: acceptUserId, status: 'PENDING' },
      data: { status: 'APPROVED' },
    });
  }

  const removeUserId = body?.removeUserId ? String(body.removeUserId) : '';
  if (removeUserId && removeUserId !== row.userId) {
    await prisma.coworkingGroupMember.deleteMany({
      where: { signupId: row.id, userId: removeUserId },
    });
  }

  const next = await prisma.coworkingSignup.findFirst({
    where: { id: row.id },
    include: groupInclude(),
  });
  return NextResponse.json({
    ok: true,
    group: serializeCoworkingGroup(next as GroupSignupRow, session.user.id),
  });
}
