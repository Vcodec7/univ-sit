import { NextResponse } from 'next/server';
import { PRIVACY_POLICY_VERSION } from '@/lib/consent-versions';
import { PRIVACY_POLICY_BODY } from '@/lib/privacy-document';
import { PRIVACY_PREVIOUS_PLAIN, PRIVACY_PREVIOUS_VERSION } from '@/lib/legal-plain';
import { diffPlainLines } from '@/lib/legal-diff';
import { htmlToPlainText } from '@/lib/system-pages';

export const dynamic = 'force-dynamic';

export async function GET() {
  const current = htmlToPlainText(PRIVACY_POLICY_BODY).slice(0, 4000);
  return NextResponse.json({
    previousVersion: PRIVACY_PREVIOUS_VERSION,
    currentVersion: PRIVACY_POLICY_VERSION,
    lines: diffPlainLines(PRIVACY_PREVIOUS_PLAIN, current),
  });
}
