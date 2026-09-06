/**
 * Detect http(s) image/gif URLs in chat text for safe preview embeds.
 */

const IMAGE_EXT = /\.(?:gif|jpe?g|png|webp|avif|bmp)(?:[?#].*)?$/i;

/** Single absolute http(s) URL that looks like an image/gif. */
export function isImageMediaUrl(raw: string): boolean {
  const s = raw.trim();
  if (!/^https?:\/\//i.test(s) && !/^www\./i.test(s)) return false;
  if (s.length > 2048) return false;
  try {
    const withProto = /^https?:\/\//i.test(s) ? s : `https://${s}`;
    const u = new URL(withProto);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false;
    if (IMAGE_EXT.test(u.pathname)) return true;
    const q = `${u.search}${u.hash}`.toLowerCase();
    if (/\.(?:gif|jpe?g|png|webp)/i.test(q)) return true;
    if (/[?&](?:format|type|ext)=(gif|jpe?g|png|webp)/i.test(u.search)) return true;
    return false;
  } catch {
    return false;
  }
}

export type MessageBodyPart =
  | { type: 'text'; value: string }
  | { type: 'image'; url: string }
  | { type: 'link'; url: string };

const URL_IN_TEXT = /(?:https?:\/\/|www\.)[^\s<>"']+/gi;

function absUrl(raw: string) {
  const url = raw.replace(/[),.;!?]+$/g, '');
  return /^https?:\/\//i.test(url) ? url : `https://${url}`;
}

/** Split message body into text, http links and image-url parts (order preserved). */
export function splitMessageBodyMedia(body: string): MessageBodyPart[] {
  const text = body || '';
  if (!text.trim()) return [{ type: 'text', value: text }];

  const trimmed = text.trim();
  if (isImageMediaUrl(trimmed) && !/\s/.test(trimmed)) {
    return [{ type: 'image', url: absUrl(trimmed) }];
  }

  const parts: MessageBodyPart[] = [];
  let last = 0;
  const re = new RegExp(URL_IN_TEXT.source, 'gi');
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) != null) {
    const cleaned = m[0].replace(/[),.;!?]+$/g, '');
    const url = absUrl(cleaned);
    const start = m.index;
    const end = start + cleaned.length;
    if (start > last) parts.push({ type: 'text', value: text.slice(last, start) });
    if (isImageMediaUrl(url)) parts.push({ type: 'image', url });
    else parts.push({ type: 'link', url });
    last = Math.max(end, m.index + m[0].length);
  }
  if (last < text.length) parts.push({ type: 'text', value: text.slice(last) });
  return parts.length ? parts : [{ type: 'text', value: text }];
}
