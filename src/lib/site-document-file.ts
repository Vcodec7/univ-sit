import { NextResponse } from 'next/server';
import { readFile, stat, writeFile, unlink } from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/prisma';
import { publishedNonDemoWhere } from '@/lib/publish';
import { contentTypeHeader, sniffDocumentMime } from '@/lib/document-mime';
import { buildPlainTextPdf, isPlainTextDocument } from '@/lib/plain-text-pdf';

/** Pretty URLs scanners hit: /documents/rules.pdf */
export const DOCUMENT_PDF_ALIASES: Record<string, string[]> = {
  rules: ['doc_pravila_dm', 'pravila', 'rules'],
  privacy: ['privacy', 'politika'],
  cookies: ['cookies'],
  terms: ['terms', 'oferta'],
};

export function documentPdfStem(raw: string): string {
  return decodeURIComponent(String(raw || ''))
    .replace(/\.pdf$/i, '')
    .replace(/^\/+/, '')
    .trim();
}

export async function findPublishedDocumentByPublicName(raw: string) {
  const stem = documentPdfStem(raw);
  if (!stem) return null;
  const published = publishedNonDemoWhere();
  const aliases = DOCUMENT_PDF_ALIASES[stem.toLowerCase()] || [];
  const ids = Array.from(new Set([stem, ...aliases]));

  const byId = await prisma.siteDocument.findFirst({
    where: { ...published, id: { in: ids } },
  });
  if (byId) return byId;

  const filePdf = `${stem}.pdf`;
  return prisma.siteDocument.findFirst({
    where: {
      ...published,
      OR: [
        { fileName: { equals: filePdf, mode: 'insensitive' } },
        { fileName: { equals: `${stem}.txt`, mode: 'insensitive' } },
        { fileName: { contains: stem, mode: 'insensitive' } },
      ],
    },
  });
}

export async function servePublishedDocumentFile(
  req: Request,
  doc: {
    id: string;
    title: string;
    fileUrl: string;
    fileName: string;
    mimeType: string | null;
  }
) {
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
