import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Eye, Plus, Trash2, Users, X } from 'lucide-react';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertCleanText, ProfanityError } from '@/lib/censor';
import { saveUploadedImage } from '@/lib/uploads';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import { parseGalleryInput, serializeClubTags } from '@/lib/clubs';
import { getGallerySettings } from '@/lib/gallery';
import AdminFilterTabs from '@/components/admin/AdminFilterTabs';
import AdminYouthStudioForm from '@/components/admin/AdminYouthStudioForm';
import { catalogStatusLabel, serializeStudioJson, stripHtml, studioFromFormData } from '@/lib/youth-studio';

async function processImage(formData: FormData) {
  const file = formData.get('imageFile') as File | null;
  const imageUrl = (formData.get('image') as string) || '';
  return saveUploadedImage(file, 'clubs', imageUrl);
}

function clubFields(formData: FormData) {
  const trimOrNull = (k: string) => {
    const v = String(formData.get(k) || '').trim();
    return v || null;
  };
  return {
    title: formData.get('title') as string,
    description: formData.get('description') as string,
    template: (formData.get('template') as string) || 'DEFAULT',
    status: (formData.get('status') as string) || 'ACTIVE',
    meetingSchedule: ((formData.get('meetingSchedule') as string) || '').trim() || null,
    meetingPlace: ((formData.get('meetingPlace') as string) || '').trim() || null,
    curatorName: ((formData.get('curatorName') as string) || '').trim() || null,
    curatorContact: ((formData.get('curatorContact') as string) || '').trim() || null,
    curatorContactPublic:
      formData.get('curatorContactPublic') === 'on' || formData.get('curatorContactPublic') === 'true',
    tags: serializeClubTags(((formData.get('tags') as string) || '').trim() || null),
    gallery: parseGalleryInput(formData.get('gallery')),
    signupUrl: ((formData.get('signupUrl') as string) || '').trim() || null,
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
  await requirePermission('clubs');
  const id = formData.get('id') as string;
  try {
    await prisma.club.delete({ where: { id } });
    revalidatePath('/admin/clubs');
    revalidatePath('/clubs');
  } catch (e) {
    console.error('Ошибка удаления', e);
  }
}

async function createItem(formData: FormData) {
  'use server';
  await requirePermission('clubs');
  try {
    const fields = clubFields(formData);
    assertCleanText(
      fields.title,
      fields.description,
      fields.meetingSchedule,
      fields.meetingPlace,
      fields.curatorName,
      fields.curatorContact,
      fields.tags
    );
    const imagePath = await processImage(formData);
    await prisma.club.create({
      data: { ...fields, image: imagePath },
    });
    revalidatePath('/admin/clubs');
    revalidatePath('/clubs');
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('Ошибка создания', e);
  }
  redirect('/admin/clubs');
}

async function updateItem(formData: FormData) {
  'use server';
  await requirePermission('clubs');
  const id = formData.get('id') as string;
  try {
    const fields = clubFields(formData);
    assertCleanText(
      fields.title,
      fields.description,
      fields.meetingSchedule,
      fields.meetingPlace,
      fields.curatorName,
      fields.curatorContact,
      fields.tags
    );
    const imagePath = await processImage(formData);
    await prisma.club.update({
      where: { id },
      data: { ...fields, image: imagePath },
    });
    revalidatePath('/admin/clubs');
    revalidatePath('/clubs');
    revalidatePath(`/clubs/${id}`);
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('Ошибка обновления', e);
  }
  redirect('/admin/clubs');
}

async function quickHide(formData: FormData) {
  'use server';
  await requirePermission('clubs');
  const id = String(formData.get('id') || '');
  const next = String(formData.get('next') || 'INACTIVE');
  await prisma.club.update({ where: { id }, data: { status: next } });
  revalidatePath('/admin/clubs');
  revalidatePath('/clubs');
  redirect('/admin/clubs');
}

function ClubFormFields({ item, orgPool = [] }: { item?: any; orgPool?: string[] }) {
  return <AdminYouthStudioForm kind="club" item={item} pool={orgPool} />;
}

export default async function AdminClubs({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; add?: string; status?: string }>;
}) {
  await requirePermissionPage('clubs');
  const resolvedParams = await searchParams;
  const isAdding = resolvedParams.add === 'true';
  const statusRaw = (resolvedParams.status || 'ALL').toUpperCase();
  const statusFilter =
    statusRaw === 'ACTIVE' ||
    statusRaw === 'INACTIVE' ||
    statusRaw === 'COMPLETED' ||
    statusRaw === 'DRAFT' ||
    statusRaw === 'REVIEW' ||
    statusRaw === 'ALL'
      ? statusRaw
      : 'ALL';

  let allItems: any[] = [];
  try {
    allItems = await prisma.club.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            applications: { where: { status: 'APPROVED' } },
          },
        },
      },
    });
  } catch {
    allItems = [];
  }

  const counts = {
    ALL: allItems.length,
    DRAFT: allItems.filter((i) => i.status === 'DRAFT').length,
    REVIEW: allItems.filter((i) => i.status === 'REVIEW').length,
    ACTIVE: allItems.filter((i) => i.status === 'ACTIVE').length,
    INACTIVE: allItems.filter((i) => i.status === 'INACTIVE').length,
    COMPLETED: allItems.filter((i) => i.status === 'COMPLETED').length,
  };
  const items = statusFilter === 'ALL' ? allItems : allItems.filter((i) => i.status === statusFilter);

  const editId = resolvedParams.edit;
  const editItem = editId ? allItems.find((i) => i.id === editId) : null;
  const showModal = isAdding || editItem;
  const gallerySettings = await getGallerySettings();
  const orgGalleryPool = gallerySettings.orgGallery;

  const statusHref = (s: string) => {
    const p = new URLSearchParams();
    p.set('status', s);
    if (isAdding) p.set('add', 'true');
    if (editId) p.set('edit', editId);
    return `?${p.toString()}`;
  };

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '6rem' }}>
      <div className="admin-page-header">
        <div>
          <h1>Клубы</h1>
          <p>Живые карточки: расписание, как вступить, обложка</p>
        </div>
        <Link href={`?add=true&status=${statusFilter}`} className="btn btn-primary">
          <Plus size={16} /> Новый клуб
        </Link>
      </div>

      <AdminFilterTabs
        ariaLabel="Статус клуба"
        items={[
          { href: statusHref('ALL'), label: 'Все', count: counts.ALL, active: statusFilter === 'ALL', tone: 'muted' },
          {
            href: statusHref('DRAFT'),
            label: 'Черновики',
            count: counts.DRAFT,
            active: statusFilter === 'DRAFT',
            tone: 'warning',
          },
          {
            href: statusHref('ACTIVE'),
            label: 'Активные',
            count: counts.ACTIVE,
            active: statusFilter === 'ACTIVE',
            tone: 'success',
          },
          {
            href: statusHref('COMPLETED'),
            label: 'Завершённые',
            count: counts.COMPLETED,
            active: statusFilter === 'COMPLETED',
          },
          {
            href: statusHref('INACTIVE'),
            label: 'Скрытые',
            count: counts.INACTIVE,
            active: statusFilter === 'INACTIVE',
            tone: 'danger',
          },
        ]}
      />

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
                <Users size={14} /> {item._count?.applications ?? 0} в клубе
                {item.meetingSchedule ? ` · ${item.meetingSchedule}` : ''}
              </p>
              <p className="admin-catalog-card__excerpt">{stripHtml(item.description || '', 140)}</p>
              <div className="admin-catalog-card__actions">
                <Link href={`/admin/clubs?edit=${item.id}&status=${statusFilter}`} className="btn btn-primary">
                  Править
                </Link>
                <Link href={`/clubs/${item.id}`} className="btn btn-secondary">
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
                  <ConfirmSubmitButton message="Удалить клуб?" className="btn btn-secondary admin-catalog-card__danger">
                    <Trash2 size={16} /> Удалить
                  </ConfirmSubmitButton>
                </form>
              </div>
            </div>
          </article>
        ))}
        {items.length === 0 ? <p className="admin-studio-hint">Ничего не найдено — создайте клуб.</p> : null}
      </div>

      {showModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog admin-modal-dialog--studio">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editItem ? 'Редактировать клуб' : 'Новый клуб'}</h3>
              <Link href="?" className="yp-modal-close" aria-label="Закрыть">
                <X size={18} />
              </Link>
            </div>
            <form action={editItem ? updateItem : createItem} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {editItem && <input type="hidden" name="id" value={editItem.id} />}
              <ClubFormFields item={editItem || undefined} orgPool={orgGalleryPool} />
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
