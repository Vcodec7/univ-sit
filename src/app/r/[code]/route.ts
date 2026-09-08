import { NextRequest, NextResponse } from 'next/server';
import { normalizeReferralCode, REF } from '@/lib/referrals';
import { originFromEnv } from '@/lib/site-identity-shared';

export const dynamic = 'force-dynamic';

function publicOrigin() {
  const env = originFromEnv({ allowLocal: false });
  if (env) return env;
  return 'https://py.idivles.ru';
}

/** /r/CODE → /register?ref=CODE + cookie for attribution */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code: raw } = await params;
  const code = normalizeReferralCode(decodeURIComponent(raw || ''));
  const url = new URL('/register', publicOrigin());
  if (code) url.searchParams.set('ref', code);

  const res = NextResponse.redirect(url);
  if (code) {
    res.cookies.set({
      name: REF.COOKIE,
      value: code,
      path: '/',
      maxAge: REF.COOKIE_DAYS * 24 * 3600,
      sameSite: 'lax',
      httpOnly: false,
      secure: url.protocol === 'https:',
    });
  }
  return res;
}
