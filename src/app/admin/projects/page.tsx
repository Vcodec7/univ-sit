import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Eye, Plus, Search, Users, X } from 'lucide-react';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertCleanText, ProfanityError } from '@/lib/censor';
import { saveUploadedImage } from '@/lib/uploads';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import { parseGalleryInput } from '@/lib/clubs';
import { getGallerySettings } from '@/lib/gallery';
import AdminYouthStudioForm from '@/components/admin/AdminYouthStudioForm';
import {
  catalogStatusLabel,
  serializeStudioJson,
  stripHtml,
  studioFromFormData,
} from '@/lib/youth-studio';

async function processImage(formData: FormData) {
  const file = formData.get('imageFile') as File | null;
  const imageUrl = (formData.get('image') as string) || '';
  return saveUploadedImage(file, 'projects', imageUrl);
}

function projectFields(formData: FormData) {
  const trimOrNull = (k: string) => {
    const v = String(formData.get(k) || '').trim();
    return v || null;
  };
  return {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    template: (formData.get('template') as string) || 'DEFAULT',
    status: (formData.get('status') as string) || 'DRAFT',
    gallery: parseGalleryInput(formData.get('gallery')),
    goal: trimOrNull('goal'),
    mission: trimOrNull('mission'),
    roadmapJson: trimOrNull('roadmapJson'),
    rolesJson: trimOrNull('rolesJson'),
    tasksJson: trimOrNull('tasksJson'),
    studioJson: serializeStudioJson(studioFromFormData(formData)),
  };
}

async function deleteItem(formData: FormData) {
  'use server';
  await requirePermission('projects');
  const id = formData.get('id') as string;
  try {
    await prisma.project.delete({ where: { id } });
    revalidatePath('/admin/projects');
  } catch (e) {
    console.error('Ошибка удаления', e);
  }
}

async function createItem(formData: FormData) {
  'use server';
  await requirePermission('projects');
  try {
    const fields = projectFields(formData);
    assertCleanText(fields.title, fields.description);
    const imagePath = await processImage(formData);
    await prisma.project.create({
      data: { ...fields, image: imagePath },
    });
    revalidatePath('/admin/projects');
    revalidatePath('/projects');
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('Ошибка создания', e);
  }
  redirect('/admin/projects');
}

async function updateItem(formData: FormData) {
  'use server';
  await requirePermission('projects');
  const id = formData.get('id') as string;
  try {
    const fields = projectFields(formData);
    assertCleanText(fields.title, fields.description);
    const imagePath = await processImage(formData);
    await prisma.project.update({
      where: { id },
      data: { ...fields, image: imagePath },
    });
    revalidatePath('/admin/projects');
    revalidatePath('/projects');
    revalidatePath(`/projects/${id}`);
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('Ошибка обновления', e);
  }
  redirect('/admin/projects');
}

async function quickHide(formData: FormData) {
  'use server';
  await requirePermission('projects');
  const id = String(formData.get('id') || '');
  const next = String(formData.get('next') || 'INACTIVE');
  await prisma.project.update({ where: { id }, data: { status: next } });
  revalidatePath('/admin/projects');
  revalidatePath('/projects');
  redirect('/admin/projects');
}

export default async function AdminProjects({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; add?: string; q?: string; status?: string; sort?: string }>;
}) {
  await requirePermissionPage('projects');
  const sp = await searchParams;
  const isAdding = sp.add === 'true';
  const q = (sp.q || '').trim().toLowerCase();
  const status = sp.status || 'ALL';
  const sort = sp.sort || 'new';

  let items: Array<{
    id: string;
    title: string;
    description: string;
    status: string;
    image: string | null;
    gallery: string | null;
    goal: string | null;
    mission: string | null;
    template: string;
    studioJson: string | null;
    roadmapJson: string | null;
    rolesJson: string | null;
    tasksJson: string | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
    _count: { applications: number };
  }> = [];
  try {
    items = await prisma.project.findMany({
      orderBy: sort === 'views' ? { viewCount: 'desc' } : { createdAt: 'desc' },
      include: {
        _count: { select: { applications: { where: { status: 'APPROVED' } } } },
      },
    });
  } catch {
    items = [];
  }

  if (status !== 'ALL') items = items.filter((i) => i.status === status);
  if (q) {
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        stripHtml(i.description, 400).toLowerCase().includes(q)
    );
  }
  if (sort === 'join') {
    items = [...items].sort((a, b) => (b._count.applications || 0) - (a._count.applications || 0));
  }

  const editItem = sp.edit ? items.find((i) => i.id === sp.edit) || null : null;
  const showModal = isAdding || Boolean(editItem);
  const gallerySettings = await getGallerySettings();
  const href = (extra: Record<string, string>) => {
    const u = new URLSearchParams();
    if (q) u.set('q', q);
    if (status !== 'ALL') u.set('status', status);
    if (sort !== 'new') u.set('sort', sort);
    Object.entries(extra).forEach(([k, v]) => u.set(k, v));
    const s = u.toString();
    return s ? `?${s}` : '?';
  };

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '6rem' }}>
      <div className="admin-page-header">
        <div>
          <h1>Проекты</h1>
          <p>Живые карточки для молодёжи — не техническая база</p>
        </div>
        <Link href="?add=true" className="btn btn-primary">
          <Plus size={16} /> Новый проект
        </Link>
      </div>

      <form className="admin-catalog-toolbar" method="get">
        <label className="admin-catalog-search">
          <Search size={16} />
          <input name="q" defaultValue={sp.q || ''} placeholder="Поиск по названию" />
        </label>
        <select name="status" defaultValue={status} aria-label="Статус">
          <option value="ALL">Все статусы</option>
          <option value="DRAFT">Черновик</option>
          <option value="REVIEW">На проверке</option>
          <option value="ACTIVE">Опубликован</option>
          <option value="INACTIVE">Скрыт</option>
          <option value="COMPLETED">Завершён</option>
        </select>
        <select name="sort" defaultValue={sort} aria-label="Сортировка">
          <option value="new">Новые</option>
          <option value="views">По просмотрам</option>
          <option value="join">По заявкам</option>
        </select>
        <button type="submit" className="btn btn-secondary">
          Показать
        </button>
      </form>

      <div className="admin-catalog-cards">
        {items.map((item) => (
          <article key={item.id} className="admin-catalog-card">
            <div
              className="admin-catalog-card__cover"
              style={item.image ? { backgroundImage: `url(${item.image})` } : undefined}
            />
            <div className="admin-catalog-card__body">
              <div className="admin-catalog-card__top">
                <h2>{item.title}</h2>
                <span className={`admin-status-pill is-${item.status}`}>{catalogStatusLabel(item.status)}</span>
              </div>
              <p className="admin-catalog-card__meta">
                <Users size={14} /> {item._count.applications} в команде · {item.viewCount || 0} просмотров ·{' '}
                {item.studioJson ? 'формат задан' : 'нужен формат участия'}
              </p>
              <p className="admin-catalog-card__excerpt">{stripHtml(item.description, 140)}</p>
              <div className="admin-catalog-card__actions">
                <Link href={href({ edit: item.id })} className="btn btn-primary">
                  Править
                </Link>
                <Link href={`/projects/${item.id}`} className="btn btn-secondary">
                  <Eye size={14} /> Как видит гость
                </Link>
                <form action={quickHide}>
                  <input type="hidden" name="id" value={item.id} />
                  <input type="hidden" name="next" value={item.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE'} />
                  <button type="submit" className="btn btn-secondary">
                    {item.status === 'ACTIVE' ? 'Снять с публикации' : 'Опубликовать'}
                  </button>
                </form>
                <form action={deleteItem}>
                  <input type="hidden" name="id" value={item.id} />
                  <ConfirmSubmitButton message="Удалить проект?" className="btn btn-secondary admin-catalog-card__danger">
                    Удалить
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="admin-studio-hint">Ничего не найдено — смените фильтр или создайте проект.</p> : null}
      </div>

      {showModal ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog admin-modal-dialog--studio">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>{editItem ? 'Карточка проекта' : 'Новый проект'}</h3>
              <Link href="/admin/projects" className="yp-modal-close" aria-label="Закрыть">
                <X size={18} />
              </Link>
            </div>
            <form action={editItem ? updateItem : createItem}>
              {editItem ? <input type="hidden" name="id" value={editItem.id} /> : null}
              <AdminYouthStudioForm kind="project" item={editItem} pool={gallerySettings.orgGallery} />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
