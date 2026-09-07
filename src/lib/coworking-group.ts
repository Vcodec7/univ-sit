import { randomBytes } from 'crypto';
import { prisma } from '@/lib/prisma';
import { conversationPairKey } from '@/lib/social';
import { groupApprovedCount, groupSeatsLeft } from '@/lib/coworking';

const memberUserSelect = {
  id: true,
  name: true,
  image: true,
} as const;

export function newCoworkingInviteToken() {
  return randomBytes(12).toString('base64url');
}

export function groupInclude() {
  return {
    space: { select: { id: true, title: true, address: true, image: true, capacity: true } },
    user: { select: memberUserSelect },
    members: {
      orderBy: { createdAt: 'asc' as const },
      include: { user: { select: memberUserSelect } },
    },
  };
}

export type GroupSignupRow = {
  id: string;
  userId: string;
  kind: string;
  seats: number;
  status: string;
  joinOpen: boolean;
  inviteToken: string | null;
  dayKey: string;
  period: string;
  startTime: Date;
  endTime: Date;
  purpose: string | null;
  space: { id: string; title: string; address: string | null; image: string | null; capacity: number };
  user: { id: string; name: string | null; image: string | null };
  members: {
    id: string;
    userId: string;
    role: string;
    status: string;
    user: { id: string; name: string | null; image: string | null };
  }[];
};

export function serializeCoworkingGroup(row: GroupSignupRow, viewerId?: string | null) {
  const approved = groupApprovedCount(row.members);
  const seatsLeft = groupSeatsLeft(row.seats, approved);
  const myMember = viewerId ? row.members.find((m) => m.userId === viewerId) : undefined;
  const isHost = Boolean(viewerId && row.userId === viewerId);
  const isMember = Boolean(myMember && myMember.status === 'APPROVED');
  const isPending = Boolean(myMember && myMember.status === 'PENDING');
  const full = seatsLeft <= 0;
  return {
    id: row.id,
    kind: row.kind,
    seats: row.seats,
    status: row.status,
    joinOpen: row.joinOpen,
    inviteToken: isHost ? row.inviteToken : row.inviteToken,
    dayKey: row.dayKey,
    period: row.period,
    startTime: row.startTime.toISOString(),
    endTime: row.endTime.toISOString(),
    purpose: row.purpose,
    space: row.space,
    organizer: row.user,
    approvedCount: approved,
    seatsLeft,
    full,
    recruiting: row.joinOpen && !full && row.status === 'CONFIRMED',
    isHost,
    isMember,
    isPending,
    myStatus: myMember?.status || (isHost ? 'APPROVED' : null),
    members: row.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      role: m.role,
      status: m.status,
      name: m.user.name,
      image: m.user.image,
    })),
    invitePath: row.inviteToken ? `/coworking/group/${row.inviteToken}` : null,
  };
}

export async function findGroupByToken(token: string) {
  if (!token) return null;
  return prisma.coworkingSignup.findFirst({
    where: { inviteToken: token, kind: 'GROUP' },
    include: groupInclude(),
  });
}

export async function sendCoworkingInviteMessages(opts: {
  hostId: string;
  hostName: string | null;
  friendIds: string[];
  inviteUrl: string;
  spaceTitle: string;
  whenLabel: string;
}) {
  const body = `${opts.hostName || 'Друг'} зовёт в открытую группу коворкинга «${opts.spaceTitle}» (${opts.whenLabel}). Присоединиться: ${opts.inviteUrl}`;
  let sent = 0;
  for (const friendId of opts.friendIds) {
    if (!friendId || friendId === opts.hostId) continue;
    const pairKey = conversationPairKey(opts.hostId, friendId);
    try {
      await prisma.$transaction(async (tx) => {
        const conversation = await tx.conversation.upsert({
          where: { pairKey },
          create: { pairKey, kind: 'DM' },
          update: {},
        });
        await tx.directMessage.create({
          data: {
            conversationId: conversation.id,
            senderId: opts.hostId,
            body,
            kind: 'TEXT',
          },
        });
        await tx.conversation.update({
          where: { id: conversation.id },
          data: { updatedAt: new Date() },
        });
        await tx.userNotification.create({
          data: {
            userId: friendId,
            type: 'MESSAGE',
            title: 'Приглашение в коворкинг',
            body: `Открытая группа: ${opts.spaceTitle}`,
            meta: JSON.stringify({
              href: opts.inviteUrl,
              conversationId: conversation.id,
              senderId: opts.hostId,
            }),
          },
        });
      });
      sent += 1;
    } catch {
      /* skip one friend */
    }
  }
  return sent;
}
