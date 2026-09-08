import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ImageResponse } from 'next/og';
import { DEFAULT_SITE_NAME } from '@/lib/site-identity-shared';
import { getSiteIdentityStatic } from '@/lib/site-identity';

export const alt = DEFAULT_SITE_NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function OpenGraphImage() {
  const { siteName } = await getSiteIdentityStatic();
  const fontData = await readFile(join(process.cwd(), 'src/fonts/unbounded/Unbounded-700.ttf'));

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '72px 88px',
          background: 'linear-gradient(135deg, #0A0C2A 0%, #4c3488 52%, #8562d8 100%)',
          color: '#ffffff',
          fontFamily: 'Unbounded',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 28,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: '#AFCA03',
            marginBottom: 18,
          }}
        >
          Официальный портал
        </div>
        <div style={{ display: 'flex', fontSize: 72, lineHeight: 1.1, maxWidth: 1000 }}>{siteName}</div>
        <div
          style={{
            display: 'flex',
            marginTop: 28,
            fontSize: 28,
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Залы · клубы · афиша · новости
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [{ name: 'Unbounded', data: fontData, style: 'normal', weight: 700 }],
    }
  );
}
