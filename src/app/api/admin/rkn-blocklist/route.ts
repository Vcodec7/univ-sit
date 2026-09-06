import { NextResponse } from 'next/server';
import { requireAdmin, aclJsonError } from '@/lib/acl';
import { listRknHosts, saveExtraRknHosts } from '@/lib/rkn-link-guard';

export async function GET() {
  try {
    await requireAdmin();
    const lists = await listRknHosts();
    return NextResponse.json(lists);
  } catch (e) {
    return aclJsonError(e);
  }
}

export async function PUT(req: Request) {
  try {
    await requireAdmin();
    const body = await req.json().catch(() => ({}));
    const raw = typeof body.hostsText === 'string' ? body.hostsText : '';
    const hosts = raw
      .split(/[\s,;]+/)
      .map((h: string) => h.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, ''))
      .filter(Boolean);
    const extra = await saveExtraRknHosts(hosts);
    return NextResponse.json({ ok: true, extra });
  } catch (e) {
    return aclJsonError(e);
  }
}
