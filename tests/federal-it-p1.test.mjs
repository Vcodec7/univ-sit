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
  const view = readFileSync(join(root, 'src/components/DocumentViewer.tsx'), 'utf8');
  const ngx = readFileSync(join(root, 'deploy/nginx-py-ty-dual.conf'), 'utf8');
  const csp = readFileSync(join(root, 'src/proxy.ts'), 'utf8');
  assert.match(api, /sniffDocumentMime/);
  assert.match(view, /docs\.google\.com\/gview/);
  assert.match(ngx, /charset off/);
  assert.match(csp, /docs\.google\.com/);
});

test('scanner does not pin event filter on coworking QR', () => {
  const ui = readFileSync(join(root, 'src/components/TicketScanner.tsx'), 'utf8');
  const logic = readFileSync(join(root, 'src/lib/scanner-check.ts'), 'utf8');
  assert.match(ui, /looksTicket/);
  assert.match(logic, /Нет активной брони коворкинга и нет билета/);
});
