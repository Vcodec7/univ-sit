/** Public visibility for CMS content with drafts / scheduled publish */

export function publishedWhere(now = new Date()) {
  return {
    status: 'PUBLISHED',
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
}

export function publishedNonDemoWhere(now = new Date()) {
  return { isDemoData: false, ...publishedWhere(now) };
}

/** Catalog entities: hide QA/seed demo rows and drafts. */
export function publicCatalogWhere() {
  return { isDemoData: false as const, status: { not: 'INACTIVE' as const } };
}

export function isPublicCatalogEntity(entity: { isDemoData?: boolean; status?: string | null }) {
  if (entity.isDemoData) return false;
  return (entity.status || 'ACTIVE') !== 'INACTIVE';
}

export function parsePublishFields(formData: FormData): {
  status: 'DRAFT' | 'PUBLISHED';
  publishedAt: Date | null;
} {
  const statusRaw = String(formData.get('status') || 'PUBLISHED').toUpperCase();
  const status = statusRaw === 'DRAFT' ? 'DRAFT' : 'PUBLISHED';
  const atRaw = String(formData.get('publishedAt') || '').trim();
  let publishedAt: Date | null = null;
  if (atRaw) {
    const d = new Date(atRaw);
    if (!Number.isNaN(d.getTime())) publishedAt = d;
  } else if (status === 'PUBLISHED') {
    publishedAt = new Date();
  }
  return { status, publishedAt };
}

export function publishLabel(status?: string | null, publishedAt?: Date | string | null) {
  const st = (status || 'PUBLISHED').toUpperCase();
  if (st === 'DRAFT') return 'Черновик';
  if (publishedAt) {
    const d = publishedAt instanceof Date ? publishedAt : new Date(publishedAt);
    if (!Number.isNaN(d.getTime()) && d.getTime() > Date.now()) {
      return `Отложено · ${d.toLocaleString('ru-RU')}`;
    }
  }
  return 'Опубликовано';
}
