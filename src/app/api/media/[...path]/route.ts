import { NextResponse } from 'next/server';
import { readFile, stat } from 'fs/promises';
import path from 'path';
import { isPathInside } from '@/lib/safe-path';
import { contentTypeHeader, sniffDocumentMime } from '@/lib/document-mime';

/**
 * Fallback media serving for environments where nginx does not alias /uploads.
 * Prefer nginx `location /uploads/` in production.
 */
export async function GET(
  _req: Request,
  ctx: { params: Promise<{ path: string[] }> }
) {
  const { path: parts } = await ctx.params;
  if (!parts?.length) {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }

  const safe = parts.map((p) => p.replace(/\.\./g, '')).filter(Boolean);
  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(uploadsRoot, ...safe);
  if (!isPathInside(uploadsRoot, filePath)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ message: 'Not found' }, { status: 404 });
    }
    const buf = await readFile(filePath);
    const mime = sniffDocumentMime(buf, filePath);
    const disposition =
      mime === 'application/pdf' || mime.startsWith('image/') || mime.startsWith('text/')
        ? 'inline'
        : 'attachment';
    const name = path.basename(filePath).replace(/["\r\n]/g, '_');
    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentTypeHeader(mime),
        'Content-Disposition': `${disposition}; filename="${name}"`,
        'Cache-Control': 'public, max-age=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Not found' }, { status: 404 });
  }
}
