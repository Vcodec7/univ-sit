import { NextResponse } from 'next/server';
import { rejectIfModuleDisabled } from '@/lib/require-module';
import {
  findPublishedDocumentByPublicName,
  servePublishedDocumentFile,
} from '@/lib/site-document-file';

export async function GET(req: Request, ctx: { params: Promise<{ name: string }> }) {
  const blocked = await rejectIfModuleDisabled('documents');
  if (blocked) return blocked;
  const { name } = await ctx.params;
  const doc = await findPublishedDocumentByPublicName(name);
  if (!doc) {
    return NextResponse.json({ message: 'Документ не найден' }, { status: 404 });
  }
  return servePublishedDocumentFile(req, doc);
}
