import { NextResponse } from 'next/server';
import { ORG_STATEMENT_TEMPLATES } from '@/lib/org-statement-templates';
import { textToDocxBuffer } from '@/lib/simple-docx';
import { applySitePlaceholders, getSiteIdentity } from '@/lib/site-identity';
import { rejectIfModuleDisabled } from '@/lib/require-module';

export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const blocked = await rejectIfModuleDisabled('documents');
  if (blocked) return blocked;

  const { id } = await ctx.params;
  const tpl = ORG_STATEMENT_TEMPLATES.find((t) => t.id === id);
  if (!tpl) {
    return NextResponse.json({ message: 'Шаблон не найден' }, { status: 404 });
  }

  const identity = await getSiteIdentity();
  const body = applySitePlaceholders(tpl.body, identity).replace(/\{\{\s*ORG\s*\}\}/g, identity.siteName);
  const buf = textToDocxBuffer(tpl.title, body);
  const fileName = `${tpl.id}.docx`;

  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename="${fileName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`,
      'Cache-Control': 'private, max-age=300',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
