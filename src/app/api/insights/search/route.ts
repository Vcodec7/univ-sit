import { NextResponse } from 'next/server';
import { logInsightSearch } from '@/lib/admin-insights';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const query = String(body.query || '');
  const hits = Number(body.hits || 0);
  const source = String(body.source || 'faq');
  try {
    await logInsightSearch(source, query, hits);
  } catch {
    /* non-blocking */
  }
  return NextResponse.json({ ok: true });
}
