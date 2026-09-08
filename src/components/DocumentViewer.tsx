'use client';

import dynamic from 'next/dynamic';
import { Download, ExternalLink, FileText } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { isOfficeDoc } from '@/lib/document-types';

const PdfViewer = dynamic(() => import('@/components/PdfViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Загрузка PDF…</div>
  ),
});

const DocxViewer = dynamic(() => import('@/components/DocxViewer'), {
  ssr: false,
  loading: () => (
    <div style={{ padding: '3rem', textAlign: 'center', color: '#475569', fontWeight: 600 }}>Загрузка документа…</div>
  ),
});

type Props = {
  documentId: string;
  fileUrl: string;
  mimeType: string;
  title: string;
  fileName: string;
  /** Absolute HTTPS URL Google Docs Viewer can fetch */
  publicFileUrl?: string;
};

function isDocx(mimeType: string, fileName: string) {
  const lower = fileName.toLowerCase();
  return (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    lower.endsWith('.docx')
  );
}

function isLegacyDoc(mimeType: string, fileName: string) {
  const lower = fileName.toLowerCase();
  return (
    (mimeType === 'application/msword' || mimeType === 'application/vnd.ms-word' || lower.endsWith('.doc')) &&
    !lower.endsWith('.docx')
  );
}

function GoogleDocsFrame({ src, title }: { src: string; title: string }) {
  const gview = `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(src)}`;
  return (
    <iframe
      title={title}
      src={gview}
      className="yp-gdocs-frame"
      allow="fullscreen"
    />
  );
}

export default function DocumentViewer({
  documentId,
  fileUrl,
  mimeType,
  title,
  fileName,
  publicFileUrl,
}: Props) {
  const inlineUrl = useMemo(
    () => `/api/documents/${documentId}/file?disposition=inline`,
    [documentId]
  );
  const downloadUrl = useMemo(
    () => `/api/documents/${documentId}/file?disposition=attachment`,
    [documentId]
  );
  const newTabUrl = useMemo(() => `/documents/${documentId}`, [documentId]);
  const [localDocx, setLocalDocx] = useState(false);
  const namedPdf =
    mimeType === 'application/pdf' ||
    fileName.toLowerCase().endsWith('.pdf') ||
    mimeType === 'text/plain' ||
    fileName.toLowerCase().endsWith('.txt');
  const [isPdf, setIsPdf] = useState(namedPdf);

  useEffect(() => {
    if (namedPdf) {
      setIsPdf(true);
      return;
    }
    let cancelled = false;
    fetch(inlineUrl, { headers: { Range: 'bytes=0-7' } })
      .then(async (r) => {
        const ct = (r.headers.get('content-type') || '').toLowerCase();
        const cd = r.headers.get('content-disposition') || '';
        if (ct.includes('application/pdf') || /\.pdf/i.test(cd)) {
          if (!cancelled) setIsPdf(true);
          return;
        }
        const buf = new Uint8Array(await r.arrayBuffer());
        if (buf[0] === 0x25 && buf[1] === 0x50 && buf[2] === 0x44 && buf[3] === 0x46) {
          if (!cancelled) setIsPdf(true);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [inlineUrl, namedPdf]);

  const isImage = mimeType.startsWith('image/');
  const docx = isDocx(mimeType, fileName);
  const legacyDoc = isLegacyDoc(mimeType, fileName);
  const cloudDocx = Boolean(docx && publicFileUrl && /^https:\/\//i.test(publicFileUrl) && !localDocx);

  return (
    <div className="yp-doc-viewer">
      <div className="yp-doc-viewer__bar">
        <div className="yp-doc-viewer__file">
          <FileText size={16} />
          <span>{fileName}</span>
        </div>
        <div className="yp-doc-viewer__actions">
          <a href={downloadUrl} className="btn btn-secondary">
            <Download size={16} /> {isPdf ? 'Скачать PDF' : 'Скачать'}
          </a>
          <a href={newTabUrl} target="_blank" rel="noopener noreferrer" className="btn btn-primary">
            <ExternalLink size={16} /> Открыть в новой вкладке
          </a>
        </div>
      </div>

      {isPdf && <PdfViewer url={inlineUrl} title={title} />}

      {cloudDocx ? (
        <>
          <GoogleDocsFrame src={publicFileUrl!} title={title} />
          <button type="button" className="yp-doc-viewer__fallback" onClick={() => setLocalDocx(true)}>
            Если предпросмотр не открылся — показать на сайте
          </button>
        </>
      ) : null}
      {docx && (!cloudDocx || localDocx) ? <DocxViewer url={inlineUrl} /> : null}

      {legacyDoc && (
        <div className="yp-doc-viewer__note">
          <p>Предпросмотр .doc на сайте недоступен. Загрузите файл как <strong>.docx</strong> или скачайте.</p>
        </div>
      )}

      {isImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={fileUrl} alt={title} className="yp-doc-viewer__img" />
      ) : null}

      {!isPdf && !docx && !legacyDoc && !isImage ? (
        <div className="yp-doc-viewer__note">Предпросмотр для этого формата недоступен. Скачайте файл.</div>
      ) : null}

      {(isPdf || docx || isOfficeDoc(mimeType, fileName)) && (
        <p className="yp-doc-viewer__hint">
          PDF отдаётся как application/pdf. DOCX открывается в Google Docs Viewer, без обязательного скачивания.
        </p>
      )}
    </div>
  );
}
