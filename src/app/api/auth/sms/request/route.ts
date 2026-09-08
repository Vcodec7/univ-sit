import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/** Public SMS login is retired (SSO + email). Gateway stays for staff notices. */
export async function POST() {
  return NextResponse.json({ message: 'Вход по SMS отключён' }, { status: 403 });
}
