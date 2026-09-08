import { NextResponse } from 'next/server';
import { PRIVACY_POLICY_VERSION } from '@/lib/consent-versions';
import { PRIVACY_PREVIOUS_VERSION } from '@/lib/legal-plain';
import { diffPlainLines } from '@/lib/legal-diff';
import { legalPlainFromMdx, readLegalMdx } from '@/lib/legal-mdx';

export const dynamic = 'force-dynamic';

export async function GET() {
  const previous = legalPlainFromMdx(readLegalMdx('privacy', 'previous'));
  const current = legalPlainFromMdx(readLegalMdx('privacy'));
  return NextResponse.json({
    previousVersion: PRIVACY_PREVIOUS_VERSION,
    currentVersion: PRIVACY_POLICY_VERSION,
    lines: diffPlainLines(previous, current),
  });
}
