import { NextResponse } from 'next/server';
import { peekCaptchaTile } from '@/lib/captcha';
import { captchaTilePng } from '@/lib/captcha-tile-png';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ challengeId: string; tileId: string }> }
) {
  const { challengeId, tileId } = await ctx.params;
  const id = String(challengeId || '').trim();
  const tile = String(tileId || '').trim();
  if (!id || id.length < 16 || !/^[a-f0-9]+$/i.test(tile)) {
    return new NextResponse(null, { status: 404 });
  }
  const poolId = await peekCaptchaTile(id, tile);
  if (!poolId) return new NextResponse(null, { status: 404 });
  try {
    const png = await captchaTilePng(poolId);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
      },
    });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
