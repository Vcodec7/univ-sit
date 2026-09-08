import { NextResponse } from 'next/server';
import { AclError, aclJsonError, requireSuperAdmin } from '@/lib/acl';
import { prisma } from '@/lib/prisma';
import { readFile } from 'fs/promises';
import { resolvePrivateStoragePath } from '@/lib/private-storage';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    await requireSuperAdmin();
    const { id } = await ctx.params;
    const row = await prisma.leaDataExport.findUnique({ where: { id } });
    if (!row) return NextResponse.json({ message: 'Не найдено' }, { status: 404 });

    const abs = resolvePrivateStoragePath(row.storagePath);
    const buf = await readFile(abs);
    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="lea-${id.slice(0, 8)}.ypenc"`,
        'X-Archive-SHA256': row.archiveSha256,
        'X-Key-Fingerprint': row.keyFingerprint,
      },
    });
  } catch (e) {
    if (e instanceof AclError) return aclJsonError(e);
    console.error('GET lea download', e);
    return NextResponse.json({ message: 'Файл недоступен' }, { status: 500 });
  }
}
