import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Eye, Plus, QrCode, Search, X } from 'lucide-react';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertCleanText, ProfanityError } from '@/lib/censor';
import { saveUploadedImage } from '@/lib/uploads';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import {
  amenitiesFromFormData,
  normalizeSpaceCategory,
} from '@/lib/spaces';
import { galleryUrls, getGallerySettings, parseGalleryItems, serializeGalleryUrls } from '@/lib/gallery';
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
  return saveUploadedImage(file, 'spaces', imageUrl);
}

function parseGallery(raw: FormDataEntryValue | null) {
  if (!raw || typeof raw !== 'string') return null;
  return serializeGalleryUrls(galleryUrls(parseGalleryItems(raw, 24)), 24);
}

function spaceFields(formData: FormData) {
  const latRaw = String(formData.get('lat') || '');
  const lngRaw = String(formData.get('lng') || '');
  const lat = latRaw.trim() === '' ? null : Number(latRaw);
  const lng = lngRaw.trim() === '' ? null : Number(lngRaw);
  const openTime = String(formData.get('openTime') || '').trim() || null;
  const closeTime = String(formData.get('closeTime') || '').trim() || null;
  const slot = Number(formData.get('slotStepMin')) || 60;
  return {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    address: formData.get('address') as string,
    lat: Number.isFinite(lat as number) ? (lat as number) : null,
    lng: Number.isFinite(lng as number) ? (lng as number) : null,
    capacity: parseInt(String(formData.get('capacity') || '50'), 10) || 50,
    template: (formData.get('template') as string) || 'DEFAULT',
    status: (formData.get('status') as string) || 'DRAFT',
    category: normalizeSpaceCategory(formData.get('category') as string),
    amenities: amenitiesFromFormData(formData),
    gallery: parseGallery(formData.get('gallery')),
    bookingMode: ['HALL', 'COWORKING', 'BOTH'].includes(String(formData.get('bookingMode') || '').toUpperCase())
      ? String(formData.get('bookingMode')).toUpperCase()
      : 'HALL',
    openTime,
    closeTime,
    slotStepMin: slot === 30 ? 30 : 60,
    studioJson: serializeStudioJson(studioFromFormData(formData)),
  };
}

async function deleteItem(formData: FormData) {
  'use server';
  await requirePermission('spaces');
  const id = formData.get('id') as string;
  try {
    await prisma.space.delete({ where: { id } });
    revalidatePath('/admin/spaces');
  } catch (e) {
    console.error('Ошибка удаления', e);
  }
}

async function createItem(formData: FormData) {
  'use server';
  await requirePermission('spaces');
  try {
    const fields = spaceFields(formData);
    assertCleanText(fields.title, fields.description, fields.address);
    const imagePath = await processImage(formData);
    await prisma.space.create({ data: { ...fields, image: imagePath } });
    revalidatePath('/admin/spaces');
    revalidatePath('/spaces');
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('Ошибка создания', e);
  }
  redirect('/admin/spaces');
}

async function updateItem(formData: FormData) {
  'use server';
  await requirePermission('spaces');
  const id = formData.get('id') as string;
  try {
    const fields = spaceFields(formData);
    assertCleanText(fields.title, fields.description, fields.address);
    const imagePath = await processImage(formData);
    await prisma.space.update({
      where: { id },
      data: { ...fields, image: imagePath },
    });
    revalidatePath('/admin/spaces');
    revalidatePath('/spaces');
    revalidatePath(`/spaces/${id}`);
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('Ошибка обновления', e);
  }
  redirect('/admin/spaces');
}

async function quickHide(formData: FormData) {
  'use server';
  await requirePermission('spaces');
  const id = String(formData.get('id') || '');
  const next = String(formData.get('next') || 'INACTIVE');
  await prisma.space.update({ where: { id }, data: { status: next } });
  revalidatePath('/admin/spaces');
  revalidatePath('/spaces');
  redirect('/admin/spaces');
}

export default async function AdminSpaces({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; add?: string; q?: string; status?: string }>;
}) {
  await requirePermissionPage('spaces');
  const sp = await searchParams;
  const isAdding = sp.add === 'true';
  const q = (sp.q || '').trim().toLowerCase();
  const status = sp.status || 'ALL';

  let items: Awaited<ReturnType<typeof prisma.space.findMany>> = [];
  try {
    items = await prisma.space.findMany({ orderBy: { createdAt: 'desc' } });
  } catch {
    items = [];
  }

  if (status !== 'ALL') items = items.filter((i) => i.status === status);
  if (q) {
    items = items.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        String(i.address || '').toLowerCase().includes(q)
    );
  }

  const editItem = sp.edit ? items.find((i) => i.id === sp.edit) || null : null;
  const showModal = isAdding || Boolean(editItem);
  const gallerySettings = await getGallerySettings();

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '6rem' }}>
      <div className="admin-page-header">
        <div>
          <h1>Пространства</h1>
          <p>Карточки площадок: зал, коворкинг, как прийти и как записаться</p>
        </div>
        <Link href="?add=true" className="btn btn-primary">
          <Plus size={16} /> Новое пространство
        </Link>
      </div>

      <form className="admin-catalog-toolbar" method="get">
        <label className="admin-catalog-search">
          <Search size={16} />
          <input name="q" defaultValue={sp.q || ''} placeholder="Поиск по названию или адресу" />
        </label>
        <select name="status" defaultValue={status} aria-label="Статус">
          <option value="ALL">Все статусы</option>
          <option value="DRAFT">Черновик</option>
          <option value="REVIEW">На проверке</option>
          <option value="ACTIVE">Опубликован</option>
          <option value="INACTIVE">Скрыт</option>
          <option value="COMPLETED">Завершён</option>
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
                {item.category || 'Общее'} · {item.bookingMode || 'HALL'} · {item.capacity} мест
                {item.address ? ` · ${item.address}` : ''}
              </p>
              <p className="admin-catalog-card__excerpt">{stripHtml(item.description || '', 140) || 'Нет описания'}</p>
              <div className="admin-catalog-card__actions">
                <Link href={`?edit=${item.id}`} className="btn btn-primary">
                  Править
                </Link>
                <Link href={`/spaces/${item.id}`} className="btn btn-secondary">
                  <Eye size={14} /> Как видит гость
                </Link>
                <Link href={`/admin/spaces/${item.id}/checkin-qr`} className="btn btn-secondary">
                  <QrCode size={14} /> QR
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
                  <ConfirmSubmitButton message="Удалить пространство?" className="btn btn-secondary admin-catalog-card__danger">
                    Удалить
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="admin-studio-hint">Ничего не найдено — создайте пространство.</p> : null}
      </div>

      {showModal ? (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog admin-modal-dialog--studio">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3>{editItem ? 'Карточка пространства' : 'Новое пространство'}</h3>
              <Link href="/admin/spaces" className="yp-modal-close" aria-label="Закрыть">
                <X size={18} />
              </Link>
            </div>
            <form action={editItem ? updateItem : createItem}>
              {editItem ? <input type="hidden" name="id" value={editItem.id} /> : null}
              <AdminYouthStudioForm kind="space" item={editItem} pool={gallerySettings.orgGallery} />
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
