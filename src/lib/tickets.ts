import crypto from 'crypto';
import { originFromEnv } from '@/lib/site-identity-shared';

export const TICKET_PREFIX = 'TICKET';
export const COWORK_PREFIX = 'COWORK';
export const SPACE_PREFIX = 'SPACE';
export const VENUE_PREFIX = 'VENUE';
export const ORG_PREFIX = 'ORG';

export type PassType = 'ticket' | 'coworking' | 'space' | 'presence';

export type ParsedPass =
  | { type: 'ticket' | 'space'; id: string; userId: string }
  | { type: 'coworking'; id: string; userId: string | null }
  | { type: 'presence'; token: string };

function ticketSecret() {
  return process.env.NEXTAUTH_SECRET || process.env.TICKET_SECRET || '';
}

function signPayload(bookingId: string, userId: string) {
  const secret = ticketSecret();
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for ticket signing');
  }
  return crypto
    .createHmac('sha256', secret)
    .update(`${bookingId}:${userId}`)
    .digest('hex')
    .slice(0, 16);
}

function signVenue(spaceId: string) {
  const secret = ticketSecret();
  if (!secret) {
    throw new Error('NEXTAUTH_SECRET is required for venue signing');
  }
  return crypto.createHmac('sha256', secret).update(`venue:${spaceId}`).digest('hex').slice(0, 20);
}

function parseSignedTriple(raw: string, prefix: string): { id: string; userId: string } | null {
  const value = extractPassPayload(raw);
  const parts = value.split('-');
  if (parts.length < 4 || parts[0].toUpperCase() !== prefix.toUpperCase()) return null;

  const sig = parts[parts.length - 1];
  const userId = parts[parts.length - 2];
  const id = parts.slice(1, -2).join('-');
  if (!id || !userId || !sig) return null;

  let expected: string;
  try {
    expected = signPayload(id, userId);
  } catch {
    return null;
  }

  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;

  return { id, userId };
}

export function extractPassPayload(raw: string) {
  const value = String(raw || '').trim();
  const fromQuery = value.match(/[?&]code=([^&]+)/i);
  if (fromQuery) {
    try {
      return decodeURIComponent(fromQuery[1]);
    } catch {
      return fromQuery[1];
    }
  }
  return value;
}

/** Signed ticket: TICKET-{bookingId}-{userId}-{sig} */
export function buildTicketCode(bookingId: string, userId: string) {
  const sig = signPayload(bookingId, userId);
  return `${TICKET_PREFIX}-${bookingId}-${userId}-${sig}`;
}

export function buildSpaceCode(bookingId: string, userId: string) {
  return `${SPACE_PREFIX}-${bookingId}-${userId}-${signPayload(bookingId, userId)}`;
}

export function buildCoworkingCode(signupId: string, userId: string) {
  return `${COWORK_PREFIX}-${signupId}-${userId}-${signPayload(signupId, userId)}`;
}

export function buildPassJson(type: 'ticket' | 'coworking' | 'space', id: string, userId?: string) {
  const payload: Record<string, string> = { type, id };
  if (userId) {
    payload.userId = userId;
    payload.sig = signPayload(id, userId);
  }
  return JSON.stringify(payload);
}

export function parsePassCode(raw: string): ParsedPass | null {
  const value = extractPassPayload(raw);
  if (!value) return null;

  const presenceMatch = value.match(/\/c\/([^/?#]+)/i);
  if (presenceMatch || /^P[A-Za-z0-9_-]{16,}$/.test(value)) {
    const token = presenceMatch ? decodeURIComponent(presenceMatch[1]) : value;
    return { type: 'presence', token };
  }

  if (value.startsWith('{')) {
    try {
      const parsed = JSON.parse(value) as { type?: string; id?: string; userId?: string; sig?: string };
      const typeRaw = String(parsed.type || '').toLowerCase();
      const id = String(parsed.id || '').trim();
      if (!id) return null;
      const type: PassType | null =
        typeRaw === 'ticket' || typeRaw === 'event'
          ? 'ticket'
          : typeRaw === 'coworking'
            ? 'coworking'
            : typeRaw === 'space'
              ? 'space'
              : null;
      if (!type) return null;
      const userId = parsed.userId ? String(parsed.userId) : '';
      const sig = parsed.sig ? String(parsed.sig) : '';
      if (type === 'coworking') {
        if (userId && sig) {
          const signed = parseSignedTriple(
            `${COWORK_PREFIX}-${id}-${userId}-${sig}`,
            COWORK_PREFIX
          );
          if (!signed) return null;
          return { type: 'coworking', id, userId };
        }
        return { type: 'coworking', id, userId: null };
      }
      if (!userId || !sig) return null;
      const prefix = type === 'space' ? SPACE_PREFIX : TICKET_PREFIX;
      const signed = parseSignedTriple(`${prefix}-${id}-${userId}-${sig}`, prefix);
      if (!signed) return null;
      return { type, id, userId };
    } catch {
      return null;
    }
  }

  const ticket = parseSignedTriple(value, TICKET_PREFIX);
  if (ticket) return { type: 'ticket', id: ticket.id, userId: ticket.userId };
  const space = parseSignedTriple(value, SPACE_PREFIX);
  if (space) return { type: 'space', id: space.id, userId: space.userId };
  const cowork = parseSignedTriple(value, COWORK_PREFIX);
  if (cowork) return { type: 'coworking', id: cowork.id, userId: cowork.userId };

  // Hotfix: bare coworking signup id (unsigned) — no hyphens in typical cuid
  if (/^[cC][a-z0-9]{20,32}$/.test(value) && !/^(TICKET|SPACE|COWORK|VENUE|ORG)-/i.test(value)) {
    return { type: 'coworking', id: value, userId: null };
  }

  return null;
}

export function parseTicketCode(raw: string): { bookingId: string; userId: string } | null {
  const parsed = parsePassCode(raw);
  if (parsed?.type === 'ticket' || parsed?.type === 'space') {
    return { bookingId: parsed.id, userId: parsed.userId };
  }
  return null;
}

/** Permanent door QR payload: VENUE-{spaceId}-{sig} */
export function buildVenueCode(spaceId: string) {
  return `${VENUE_PREFIX}-${spaceId}-${signVenue(spaceId)}`;
}

export function parseVenueCode(raw: string): { spaceId: string } | null {
  const value = String(raw || '').trim();
  // Also accept full URL containing the code
  const match = value.match(/VENUE-[A-Za-z0-9_-]+-[a-f0-9]{20}/i);
  const code = match ? match[0] : value;
  const parts = code.split('-');
  if (parts.length < 3 || parts[0].toUpperCase() !== VENUE_PREFIX) return null;
  const sig = parts[parts.length - 1];
  const spaceId = parts.slice(1, -1).join('-');
  if (!spaceId || !sig) return null;
  let expected: string;
  try {
    expected = signVenue(spaceId);
  } catch {
    return null;
  }
  const a = Buffer.from(sig.toLowerCase());
  const b = Buffer.from(expected.toLowerCase());
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return { spaceId };
}

/** Public self check-in URL for printed QR */
export function buildVenueCheckInUrl(spaceId: string, origin?: string) {
  const base = (origin || originFromEnv()).replace(/\/$/, '');
  const code = buildVenueCode(spaceId);
  return `${base}/check-in?code=${encodeURIComponent(code)}`;
}

function signOrgEntrance() {
  const secret = ticketSecret();
  if (!secret) throw new Error('NEXTAUTH_SECRET is required for org signing');
  return crypto.createHmac('sha256', secret).update('org:entrance:portal').digest('hex').slice(0, 20);
}

/** Single permanent QR for organization entrance (all spaces). ORG-portal-{sig} */
export function buildOrgEntranceCode() {
  return `${ORG_PREFIX}-portal-${signOrgEntrance()}`;
}

export function parseOrgEntranceCode(raw: string): boolean {
  const value = String(raw || '').trim();
  const match = value.match(/ORG-portal-[a-f0-9]{20}/i);
  const code = match ? match[0] : value;
  const parts = code.split('-');
  if (parts.length < 3 || parts[0].toUpperCase() !== ORG_PREFIX) return false;
  if (parts[1] !== 'portal') return false;
  const sig = parts[parts.length - 1];
  let expected: string;
  try {
    expected = signOrgEntrance();
  } catch {
    return false;
  }
  const a = Buffer.from(sig.toLowerCase());
  const b = Buffer.from(expected.toLowerCase());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** URL for the single org entrance QR (participants scan at the door). */
export function buildOrgEntranceCheckInUrl(origin?: string) {
  const base = (origin || originFromEnv()).replace(/\/$/, '');
  const code = buildOrgEntranceCode();
  return `${base}/check-in?code=${encodeURIComponent(code)}`;
}
