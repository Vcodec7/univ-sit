import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Edit, Trash2, X, Users } from 'lucide-react';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import ConfirmSubmitButton from '@/components/admin/ConfirmSubmitButton';
import { assertCleanText, ProfanityError } from '@/lib/censor';
import { saveUploadedImage } from '@/lib/uploads';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import { parseGalleryInput, serializeClubTags } from '@/lib/clubs';
import { getGallerySettings } from '@/lib/gallery';
import AdminFilterTabs from '@/components/admin/AdminFilterTabs';
import AdminYouthStudioForm from '@/components/admin/AdminYouthStudioForm';
import { serializeStudioJson, studioFromFormData } from '@/lib/youth-studio';

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
    statusRaw === 'ACTIVE' || statusRaw === 'INACTIVE' || statusRaw === 'COMPLETED' || statusRaw === 'ALL'
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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--foreground)', marginBottom: '0.25rem' }}>Клубы</h1>
          <p style={{ color: 'var(--muted)', fontSize: '0.95rem', margin: 0 }}>
            Расписание, куратор, галерея и заявки участников
          </p>
        </div>
        <Link
          href={`?add=true&status=${statusFilter}`}
          className="btn btn-primary"
          style={{
            padding: '0.6rem 1.5rem',
            borderRadius: '100px',
            boxShadow: '0 4px 12px rgba(59,130,246,0.25)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          Добавить клуб
        </Link>
      </div>

      <AdminFilterTabs
        ariaLabel="Статус клуба"
        items={[
          { href: statusHref('ALL'), label: 'Все', count: counts.ALL, active: statusFilter === 'ALL', tone: 'muted' },
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

      <div className="admin-table-wrap" style={{ padding: '0.5rem 0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #f1f5f9' }}>
              <th style={{ padding: '0.75rem', color: 'var(--muted)' }}>Название</th>
              <th style={{ padding: '0.75rem', color: 'var(--muted)' }}>Статус</th>
              <th style={{ padding: '0.75rem', color: 'var(--muted)' }}>Участники</th>
              <th style={{ padding: '0.75rem', color: 'var(--muted)' }}>Расписание</th>
              <th style={{ padding: '0.75rem', color: 'var(--muted)' }}>Фото</th>
              <th style={{ padding: '0.75rem', color: 'var(--muted)', textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td data-label="Название" style={{ padding: '0.75rem', fontWeight: 500 }}>
                  <Link href={`/clubs/${item.id}`} style={{ color: 'var(--primary)', textDecoration: 'none' }}>
                    {item.title}
                  </Link>
                </td>
                <td data-label="Статус" style={{ padding: '0.75rem' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      padding: '0.2rem 0.6rem',
                      borderRadius: '100px',
                      fontWeight: 600,
                      backgroundColor:
                        item.status === 'ACTIVE'
                          ? 'rgba(34,197,94,0.1)'
                          : item.status === 'COMPLETED'
                            ? 'rgba(59,130,246,0.1)'
                            : 'rgba(239,68,68,0.1)',
                      color:
                        item.status === 'ACTIVE' ? '#15803d' : item.status === 'COMPLETED' ? '#1d4ed8' : '#b91c1c',
                    }}
                  >
                    {item.status === 'ACTIVE' ? 'Активный' : item.status === 'COMPLETED' ? 'Завершён' : 'Скрыт'}
                  </span>
                </td>
                <td data-label="Участники" style={{ padding: '0.75rem', color: 'var(--muted)' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <Users size={14} /> {item._count?.applications ?? 0}
                  </span>
                </td>
                <td data-label="Расписание" style={{ padding: '0.75rem', color: 'var(--muted)', fontSize: '0.88rem' }}>
                  {item.meetingSchedule || '—'}
                </td>
                <td data-label="Фото" style={{ padding: '0.75rem' }}>
                  {item.image ? (
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 6,
                        backgroundImage: `url(${item.image})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        border: '1px solid rgba(0,0,0,0.1)',
                      }}
                    />
                  ) : (
                    '—'
                  )}
                </td>
                <td data-label="Действия" style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <div style={{ display: 'flex', gap: '0.25rem', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Link href={`/admin/clubs?edit=${item.id}`} className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--primary)' }}>
                      <Edit size={16} />
                    </Link>
                    <form action={deleteItem}>
                      <input type="hidden" name="id" value={item.id} />
                      <ConfirmSubmitButton message="Удалить клуб?" className="btn btn-secondary" style={{ padding: '0.5rem', color: 'var(--accent)' }}>
                        <Trash2 size={16} />
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} style={{ padding: '1rem', textAlign: 'center', color: 'var(--muted)' }}>
                  Нет записей
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-dialog">
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
