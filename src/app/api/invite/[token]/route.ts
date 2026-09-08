import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getSiteIdentity, isLocalOrigin } from '@/lib/site-identity';
import { originFromEnv } from '@/lib/site-identity-shared';

async function resolvePublicOrigin() {
  const identity = await getSiteIdentity();
  if (identity.publicOrigin && !isLocalOrigin(identity.publicOrigin)) return identity.publicOrigin;
  const env = originFromEnv({ allowLocal: false });
  if (env) return env;
  return 'https://py.idivles.ru';
}

/** Resolve friend-invite token → redirect to public profile with invite query. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const clean = (token || '').trim();
    const origin = await resolvePublicOrigin();
    if (!clean || clean.length > 64) {
      return NextResponse.redirect(`${origin}/friends`);
    }

    const user = await prisma.user.findFirst({
      where: {
        friendInviteToken: clean,
        deletedAt: null,
        profileVisibility: 'PRIVATE',
      },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.redirect(`${origin}/friends?invite=invalid`);
    }

    return NextResponse.redirect(
      `${origin}/u/${user.id}?invite=${encodeURIComponent(clean)}`
    );
  } catch (error) {
    console.error('GET /api/invite/[token]', error);
    const origin = await resolvePublicOrigin().catch(() => 'https://py.idivles.ru');
    return NextResponse.redirect(`${origin}/friends`);
  }
}
