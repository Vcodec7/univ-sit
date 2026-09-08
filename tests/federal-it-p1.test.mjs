import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

test('PDF magic bytes are detected in document MIME helper', () => {
  const mime = readFileSync(join(root, 'src/lib/document-mime.ts'), 'utf8');
  assert.match(mime, /0x25 && b\[1\] === 0x50 && b\[2\] === 0x44 && b\[3\] === 0x46/);
  assert.match(mime, /application\/pdf/);
});

test('document API and viewer use PDF MIME and Google Docs Viewer', () => {
  const api = readFileSync(join(root, 'src/app/api/documents/[id]/file/route.ts'), 'utf8');
  const serve = readFileSync(join(root, 'src/lib/site-document-file.ts'), 'utf8');
  const view = readFileSync(join(root, 'src/components/DocumentViewer.tsx'), 'utf8');
  const ngx = readFileSync(join(root, 'deploy/nginx-py-ty-dual.conf'), 'utf8');
  const csp = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
  assert.match(api, /servePublishedDocumentFile/);
  assert.match(serve, /sniffDocumentMime/);
  assert.match(serve, /buildPlainTextPdf/);
  assert.match(serve, /isPlainTextDocument/);
  assert.match(serve, /rules: \['doc_pravila_dm'/);
  assert.match(view, /docs\.google\.com\/gview/);
  assert.match(view, /text\/plain/);
  assert.match(ngx, /charset off/);
  assert.match(csp, /docs\.google\.com/);
  const seed = readFileSync(join(root, 'scripts/seed-official-documents.mjs'), 'utf8');
  assert.match(seed, /application\/pdf/);
  assert.match(seed, /buildPlainTextPdf/);
});

test('plain-text catalog helper writes real PDF magic bytes', async () => {
  const { buildPlainTextPdf } = await import('../scripts/lib/plain-text-pdf.mjs');
  const buf = await buildPlainTextPdf(
    { title: 'Правила ДМ', body: 'Посещение клубов — по записи.\nMAX: +7 988 236-50-22' },
    join(root, 'public', 'fonts')
  );
  assert.equal(buf[0], 0x25);
  assert.equal(buf[1], 0x50);
  assert.equal(buf[2], 0x44);
  assert.equal(buf[3], 0x46);
  assert.ok(buf.length > 800);
});

test('scanner does not pin event filter on coworking QR', () => {
  const ui = readFileSync(join(root, 'src/components/TicketScanner.tsx'), 'utf8');
  const logic = readFileSync(join(root, 'src/lib/scanner-check.ts'), 'utf8');
  assert.match(ui, /looksTicket/);
  assert.match(logic, /Нет активной брони коворкинга и нет билета/);
});
