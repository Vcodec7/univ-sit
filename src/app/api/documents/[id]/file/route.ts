import { NextResponse } from 'next/server';
import { readFile, stat, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { publishedNonDemoWhere } from '@/lib/publish';
import { rejectIfModuleDisabled } from '@/lib/require-module';
import { contentTypeHeader, sniffDocumentMime } from '@/lib/document-mime';
import { buildPlainTextPdf, isPlainTextDocument } from '@/lib/plain-text-pdf';

/**
 * Stream a published document with correct MIME and Content-Disposition.
 * ?disposition=inline  → open in browser (PDF preview / new tab)
 * ?disposition=attachment → force download
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const blocked = await rejectIfModuleDisabled('documents');
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const doc = await prisma.siteDocument.findFirst({
    where: { id, ...publishedNonDemoWhere() },
  });
  if (!doc) {
    return NextResponse.json({ message: 'Документ не найден' }, { status: 404 });
  }

  const urlPath = doc.fileUrl.replace(/^\/+/, '');
  if (!urlPath.startsWith('uploads/')) {
    return NextResponse.json({ message: 'Некорректный путь файла' }, { status: 400 });
  }

  const uploadsRoot = path.resolve(process.cwd(), 'public', 'uploads');
  const filePath = path.resolve(process.cwd(), 'public', urlPath);
  const { isPathInside } = await import('@/lib/safe-path');
  if (!isPathInside(uploadsRoot, filePath)) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  try {
    const info = await stat(filePath);
    if (!info.isFile()) {
      return NextResponse.json({ message: 'Файл не найден' }, { status: 404 });
    }
    let buf = await readFile(filePath);
    let mime = sniffDocumentMime(buf, doc.fileName || filePath, doc.mimeType);

    if (isPlainTextDocument(mime, doc.fileName || filePath, buf)) {
      const pdfBytes = await buildPlainTextPdf({
        title: doc.title,
        body: buf.toString('utf8'),
        footer: 'Официальный документ портала · PDF',
      });
      buf = Buffer.from(pdfBytes);
      mime = 'application/pdf';
      const pdfName = (doc.fileName || 'document.txt').replace(/\.[^.]+$/, '') + '.pdf';
      const pdfPath = filePath.replace(/\.txt$/i, '.pdf');
      try {
        await writeFile(pdfPath, buf);
        const pdfUrl = doc.fileUrl.replace(/\.txt$/i, '.pdf');
        await prisma.siteDocument.update({
          where: { id: doc.id },
          data: {
            fileUrl: pdfUrl.startsWith('/') ? pdfUrl : doc.fileUrl,
            fileName: pdfName,
            mimeType: 'application/pdf',
            sizeBytes: buf.length,
          },
        });
        if (pdfPath !== filePath) {
          await unlink(filePath).catch(() => undefined);
        }
      } catch (e) {
        console.error('catalog txt→pdf persist', e);
      }
    }

    const { searchParams } = new URL(req.url);
    const disposition =
      searchParams.get('disposition') === 'attachment' ? 'attachment' : 'inline';
    const ext = mime === 'application/pdf' ? '.pdf' : path.extname(filePath).toLowerCase();
    let safeName = doc.fileName.replace(/["\r\n]/g, '_') || `document${ext}`;
    if (mime === 'application/pdf' && !safeName.toLowerCase().endsWith('.pdf')) {
      safeName = safeName.replace(/\.[^.]+$/, '') + '.pdf';
    }

    return new NextResponse(buf, {
      headers: {
        'Content-Type': contentTypeHeader(mime),
        'Content-Length': String(buf.length),
        'Content-Disposition': `${disposition}; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`,
        'Cache-Control': 'public, max-age=3600',
        'X-Content-Type-Options': 'nosniff',
      },
    });
  } catch {
    return NextResponse.json({ message: 'Файл не найден' }, { status: 404 });
  }
}
