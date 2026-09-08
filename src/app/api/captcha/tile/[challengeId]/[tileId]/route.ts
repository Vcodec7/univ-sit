import { NextResponse } from 'next/server';
import { renderCaptchaTilePng } from '@/lib/captcha';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ challengeId: string; tileId: string }> }
) {
  const { challengeId, tileId } = await ctx.params;
  if (!/^[a-f0-9]{16,}$/i.test(challengeId) || !/^[a-f0-9]{8,}$/i.test(tileId)) {
    return new NextResponse('Not found', { status: 404 });
  }
  const png = await renderCaptchaTilePng(challengeId, tileId);
  if (!png) return new NextResponse('Not found', { status: 404 });
  return new NextResponse(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'no-store',
    },
  });
}
