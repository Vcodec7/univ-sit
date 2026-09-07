import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const itemId = String(body.itemId || '');
  const categoryId = String(body.categoryId || '');
  try {
    if (itemId) {
      await prisma.faqItem.update({
        where: { id: itemId },
        data: { viewCount: { increment: 1 } },
      });
    }
    if (categoryId) {
      await prisma.faqCategory.update({
        where: { id: categoryId },
        data: { viewCount: { increment: 1 } },
      });
    }
  } catch {
    /* ignore */
  }
  return NextResponse.json({ ok: true });
}
