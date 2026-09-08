import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { publishedNonDemoWhere } from '@/lib/publish';
import { rejectIfModuleDisabled } from '@/lib/require-module';
import { servePublishedDocumentFile } from '@/lib/site-document-file';

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
  return servePublishedDocumentFile(req, doc);
}
