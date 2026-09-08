'use client';
import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useVoice } from '@/components/VoiceProvider';

export default function QRCodeDisplay({ value, size = 120 }: { value: string; size?: number }) {
  const [src, setSrc] = useState<string>('');
  const { loadout } = useVoice();
  const [lite, setLite] = useState(true);
  useEffect(() => {
    setLite(
      window.matchMedia('(pointer: coarse)').matches || window.matchMedia('(max-width: 900px)').matches
    );
  }, []);
  const ticketFx = lite ? '' : loadout.ticket || '';

  useEffect(() => {
    if (!value) {
      setSrc('');
      return;
    }
    QRCode.toDataURL(value, {
      margin: 3,
      width: size,
      errorCorrectionLevel: 'M',
      color: { dark: '#0f172a', light: '#ffffff' },
    })
      .then((url) => {
        setSrc(url);
      })
      .catch((err) => {
        console.error(err);
      });
  }, [value, size]);

  if (!src) return <div style={{ width: size, height: size, background: '#f1f5f9', borderRadius: 8 }} />;

  return (
    <div
      className={`yp-ticket-qr yp-qr-live${ticketFx ? ` is-${ticketFx}` : ''}`}
      data-eco-ticket={ticketFx || undefined}
    >
      <span className="yp-qr-live__ring" aria-hidden />
      <span className="yp-qr-live__hole" aria-hidden />
      <img
        src={src}
        alt="QR-пропуск"
        width={size}
        height={size}
      />
    </div>
  );
}
