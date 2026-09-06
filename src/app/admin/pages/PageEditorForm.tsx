import Link from 'next/link';
import AdminYouthStudioForm from '@/components/admin/AdminYouthStudioForm';
import { createPage, updatePage } from './actions';
import { isSystemPageSlug, publicPagePath } from '@/lib/system-pages';

type PageEditorFormProps = {
  mode: 'create' | 'edit';
  page?: {
    id: string;
    slug: string;
    title: string;
    content: string;
    images: string;
    menuPosition: string;
    template: string;
    status?: string | null;
    publishedAt?: Date | string | null;
    studioJson?: string | null;
  } | null;
  saved?: boolean;
  error?: boolean;
};

export default function PageEditorForm({ mode, page, saved, error }: PageEditorFormProps) {
  const action = mode === 'edit' ? updatePage : createPage;
  const publicPath = page?.slug ? publicPagePath(page.slug) : null;
  const system = Boolean(page?.slug && isSystemPageSlug(page.slug));

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '4rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem', marginBottom: '1.25rem', flexWrap: 'wrap' }}>
        <div>
          <Link href="/admin/pages" style={{ color: 'var(--muted)', fontSize: '0.9rem' }}>
            ← К списку страниц
          </Link>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0.35rem 0 0' }}>
            {mode === 'edit'
              ? page?.slug === 'privacy'
                ? 'Политика конфиденциальности'
                : 'Конструктор страницы'
              : 'Новая страница'}
          </h1>
        </div>
        {publicPath ? (
          <a href={publicPath} target="_blank" rel="noreferrer" className="btn btn-secondary">
            Открыть на сайте
          </a>
        ) : null}
      </div>

      {system ? (
        <p className="admin-studio-hint" style={{ marginBottom: '1rem' }}>
          Системная страница: адрес URL зафиксирован.
        </p>
      ) : null}
      {saved ? (
        <div style={{ padding: '0.85rem 1rem', background: 'rgba(22,163,74,0.1)', color: '#15803d', borderRadius: 10, marginBottom: '1rem', fontWeight: 600 }}>
          Сохранено
        </div>
      ) : null}
      {error ? (
        <div style={{ padding: '0.85rem 1rem', background: 'rgba(220,38,38,0.1)', color: '#b91c1c', borderRadius: 10, marginBottom: '1rem', fontWeight: 600 }}>
          Не удалось сохранить. Проверьте поля и отсутствие мата в тексте.
        </div>
      ) : null}

      <form action={action} className="glass" style={{ padding: '1.25rem' }}>
        {mode === 'edit' && page ? <input type="hidden" name="id" value={page.id} /> : null}
        <AdminYouthStudioForm kind="page" item={page} pool={[]} />
      </form>
    </div>
  );
}
