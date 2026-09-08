import { PDFDocument, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { readFile } from 'fs/promises';
import { join } from 'path';

function wrapLine(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const raw = text.replace(/\t/g, '  ');
  if (!raw) return [''];
  if (font.widthOfTextAtSize(raw, size) <= maxWidth) return [raw];
  const words = raw.split(/(\s+)/);
  const lines: string[] = [];
  let cur = '';
  const push = () => {
    if (cur) lines.push(cur);
    cur = '';
  };
  for (const w of words) {
    if (!w) continue;
    const next = cur + w;
    if (cur && font.widthOfTextAtSize(next, size) > maxWidth) {
      push();
      if (font.widthOfTextAtSize(w, size) > maxWidth) {
        let chunk = '';
        for (const ch of [...w]) {
          const trial = chunk + ch;
          if (chunk && font.widthOfTextAtSize(trial, size) > maxWidth) {
            lines.push(chunk);
            chunk = ch;
          } else chunk = trial;
        }
        cur = chunk;
      } else cur = w.trimStart();
    } else cur = next;
  }
  push();
  return lines.length ? lines : [''];
}

/** A4 PDF with Cyrillic (DejaVu) from plain UTF-8 text. */
export async function buildPlainTextPdf(input: {
  title: string;
  body: string;
  footer?: string;
}): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const fontsDir = join(process.cwd(), 'public', 'fonts');
  const [regular, bold] = await Promise.all([
    readFile(join(fontsDir, 'DejaVuSans.ttf')),
    readFile(join(fontsDir, 'DejaVuSans-Bold.ttf')),
  ]);
  const font = await pdf.embedFont(regular, { subset: true });
  const fontBold = await pdf.embedFont(bold, { subset: true });

  const pageW = 595.28;
  const pageH = 841.89;
  const margin = 48;
  const maxWidth = pageW - margin * 2;
  const ink = rgb(0.08, 0.1, 0.16);
  const muted = rgb(0.35, 0.4, 0.48);

  let page: PDFPage = pdf.addPage([pageW, pageH]);
  let y = pageH - margin;

  const ensure = (need: number) => {
    if (y < margin + need) {
      page = pdf.addPage([pageW, pageH]);
      y = pageH - margin;
    }
  };

  const drawLines = (lines: string[], size: number, f: PDFFont, gap: number, color = ink) => {
    for (const line of lines) {
      ensure(size + 4);
      if (line) {
        page.drawText(line, { x: margin, y, size, font: f, color });
      }
      y -= size + gap;
    }
  };

  const title = String(input.title || 'Документ').trim() || 'Документ';
  drawLines(wrapLine(fontBold, title, 16, maxWidth), 16, fontBold, 6);
  y -= 8;

  const body = String(input.body || '').replace(/\r\n/g, '\n');
  for (const para of body.split('\n')) {
    if (!para.trim()) {
      y -= 8;
      continue;
    }
    drawLines(wrapLine(font, para, 11, maxWidth), 11, font, 4);
  }

  if (input.footer) {
    ensure(18);
    y -= 10;
    drawLines(wrapLine(font, input.footer, 8, maxWidth), 8, font, 3, muted);
  }

  return pdf.save();
}

export function isPlainTextDocument(mime: string, fileName: string, buf: Uint8Array) {
  if (buf.length >= 5 && buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
    return false;
  }
  const name = fileName.toLowerCase();
  const m = mime.split(';')[0].trim().toLowerCase();
  if (name.endsWith('.txt') || m === 'text/plain' || m.startsWith('text/')) return true;
  return false;
}
