/** MIME from extension + magic bytes so PDFs are never served as text. */

const EXT_MIME: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.txt': 'text/plain; charset=utf-8',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
};

export function mimeFromFileName(fileName: string, fallback = 'application/octet-stream') {
  const ext = fileName.includes('.') ? `.${fileName.split('.').pop()!.toLowerCase()}` : '';
  return EXT_MIME[ext] || fallback;
}

export function sniffDocumentMime(
  buf: Uint8Array | Buffer,
  fileName: string,
  declared?: string | null
): string {
  const b = buf instanceof Uint8Array ? buf : new Uint8Array(buf);
  const name = String(fileName || '').toLowerCase();
  if (b.length >= 5 && b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) {
    return 'application/pdf';
  }
  if (b.length >= 2 && b[0] === 0x50 && b[1] === 0x4b) {
    if (name.endsWith('.docx') || (declared || '').includes('wordprocessingml')) {
      return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    }
  }
  const fromName = mimeFromFileName(name);
  if (fromName !== 'application/octet-stream') return fromName;
  const d = String(declared || '').split(';')[0].trim().toLowerCase();
  if (d === 'application/pdf' || d.includes('word') || d.startsWith('image/') || d === 'text/plain') {
    return declared!.split(';')[0].trim();
  }
  return 'application/octet-stream';
}

export function contentTypeHeader(mime: string) {
  if (mime === 'application/pdf' || mime.includes('word') || mime.startsWith('image/')) {
    return mime;
  }
  return mime;
}
