import { NextResponse } from 'next/server';
import { requirePermission, aclJsonError } from '@/lib/acl';
import { getInterestInsights } from '@/lib/admin-insights';
import { parseStatsRange } from '@/lib/stats-period';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    await requirePermission(['stats', 'pages', 'projects']);
    const url = new URL(req.url);
    const range = parseStatsRange(url.searchParams);
    const data = await getInterestInsights(range);
    return NextResponse.json(data);
  } catch (e) {
    return aclJsonError(e);
  }
}
