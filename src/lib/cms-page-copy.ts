/** Public labels for CMS pages — same meaning, clearer youth tone. */
const CMS_COPY: Record<string, { title: string; lead?: string }> = {
  'pravila-dm': {
    title: 'Правила в доме',
    lead: 'Как ведём себя на площадке Дома молодёжи: запись, распорядок, съёмка.',
  },
  media: {
    title: 'Медиапроекты',
    lead: 'Блоги, съёмки и фотоотчёты медиацентра — вместе с премией «ШУМ», группой VK и проектами Центра.',
  },
};

export function publicCmsTitle(slug: string | null | undefined, fallback: string) {
  const key = (slug || '').trim().toLowerCase();
  return CMS_COPY[key]?.title || fallback;
}

export function publicCmsLead(slug: string | null | undefined) {
  const key = (slug || '').trim().toLowerCase();
  return CMS_COPY[key]?.lead || '';
}
