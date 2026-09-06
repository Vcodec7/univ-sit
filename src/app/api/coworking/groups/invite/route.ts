import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { assertSameOrigin } from '@/lib/csrf-origin';
import { aclJsonError, requireEndUser } from '@/lib/acl';
import { resolveCoworkingPeriod } from '@/lib/coworking';
import { areFriends } from '@/lib/social';
import {
  groupInclude,
  serializeCoworkingGroup,
  sendCoworkingInviteMessages,
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
  const signupId = String(body?.signupId || '');
  const friendIds = Array.isArray(body?.friendIds)
    ? body.friendIds.map((id: unknown) => String(id)).filter(Boolean)
    : [];
  if (!signupId || friendIds.length === 0) {
    return NextResponse.json({ message: 'Выберите друзей' }, { status: 400 });
  }

  const row = await prisma.coworkingSignup.findFirst({
    where: { id: signupId, kind: 'GROUP', userId: session.user.id },
    include: groupInclude(),
  });
  if (!row || !row.inviteToken) {
    return NextResponse.json({ message: 'Группа не найдена' }, { status: 404 });
  }

  const allowed: string[] = [];
  for (const id of friendIds.slice(0, 20)) {
    if (await areFriends(session.user.id, id)) allowed.push(id);
  }
  if (allowed.length === 0) {
    return NextResponse.json({ message: 'Пригласить можно только друзей сайта' }, { status: 403 });
  }

  const origin = new URL(req.url).origin;
  const inviteUrl = `${origin}/coworking/group/${row.inviteToken}`;
  const period = resolveCoworkingPeriod(row.period);
  const sent = await sendCoworkingInviteMessages({
    hostId: session.user.id,
    hostName: session.user.name || null,
    friendIds: allowed,
    inviteUrl,
    spaceTitle: row.space.title,
    whenLabel: `${row.dayKey} ${period.start}–${period.end}`,
  });

  return NextResponse.json({
    ok: true,
    sent,
    group: serializeCoworkingGroup(row as GroupSignupRow, session.user.id),
  });
}
