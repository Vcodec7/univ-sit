/** Sochi wall clock + a compact solar window (43.6°N, Europe/Moscow). */

export type SkyPhase = 'night' | 'dawn' | 'day' | 'sunset' | 'dusk';

export type SochiSky = {
  phase: SkyPhase;
  hour: number;
  sunX: number;
  sunY: number;
  moonX: number;
  moonY: number;
  sunVisible: boolean;
  moonVisible: boolean;
};

const SOCHI_TZ = 'Europe/Moscow';

export function sochiDayMinute(date: Date): { dayOfYear: number; hour: number } {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: SOCHI_TZ,
    hour: '2-digit',
    minute: '2-digit',
    month: 'numeric',
    day: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(date);
  const grab = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  const month = grab('month');
  const day = grab('day');
  const hour = grab('hour') + grab('minute') / 60;
  const y = date.getUTCFullYear();
  const start = Date.UTC(y, 0, 0);
  // Approximate day-of-year from Sochi calendar date (not UTC date).
  const doy = Math.floor((Date.UTC(y, month - 1, day) - start) / 86400000);
  return { dayOfYear: doy, hour };
}

/** Longer summer days, shorter winter — good enough for a sky grade. */
export function sochiSunWindow(dayOfYear: number) {
  const tilt = Math.cos((2 * Math.PI * (dayOfYear - 172)) / 365);
  return {
    sunrise: 6.55 - tilt * 1.55,
    sunset: 18.45 + tilt * 1.55,
  };
}

export function resolveSochiSky(date: Date = new Date()): SochiSky {
  const { dayOfYear, hour } = sochiDayMinute(date);
  const { sunrise, sunset } = sochiSunWindow(dayOfYear);
  const span = Math.max(8, sunset - sunrise);
  const t = (hour - sunrise) / span;
  const sunVisible = hour >= sunrise - 0.15 && hour <= sunset + 0.15;
  const sunX = Math.min(0.92, Math.max(0.08, t)) * 100;
  const sunY = 14 + (1 - Math.sin(Math.min(1, Math.max(0, t)) * Math.PI)) * 36;
  const moonT = hour < 12 ? (hour + 12) / 24 : (hour - 12) / 24;
  const moonX = 10 + moonT * 80;
  const moonY = 16 + (1 - Math.sin(moonT * Math.PI)) * 28;

  let phase: SkyPhase = 'day';
  if (hour < sunrise - 0.7 || hour >= sunset + 0.7) phase = 'night';
  else if (hour < sunrise + 0.55) phase = 'dawn';
  else if (hour >= sunset - 1.05 && hour < sunset + 0.2) phase = 'sunset';
  else if (hour >= sunset + 0.2) phase = 'dusk';

  return {
    phase,
    hour,
    sunX,
    sunY,
    moonX,
    moonY,
    sunVisible,
    moonVisible: phase === 'night' || phase === 'dusk' || phase === 'dawn',
  };
}
