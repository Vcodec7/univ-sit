import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { assertCleanText, ProfanityError } from '@/lib/censor';
import { saveUploadedImage } from '@/lib/uploads';
import { requirePermission, requirePermissionPage } from '@/lib/acl';
import { parsePublishFields } from '@/lib/publish';
import { normalizeVkVideoEmbed } from '@/lib/vk-media';
import NewsDraftForm from '@/components/admin/NewsDraftForm';
import NewsListBoard from '@/components/admin/NewsListBoard';

function resolveVideoEmbed(formData: FormData): string | null {
  const raw = String(formData.get('videoEmbedUrl') || '').trim();
  if (!raw) return null;
  const normalized = normalizeVkVideoEmbed(raw);
  if (normalized) return normalized;
  // Accept plain wall/video page links: video-123_456 or z=video-123_456
  try {
    const u = new URL(raw);
    const host = u.hostname.replace(/^www\./, '');
    if (host !== 'vk.com' && host !== 'vk.ru') return null;
    const fromPath = u.pathname.match(/\/video(-?\d+)_(\d+)/);
    const fromQuery = (u.searchParams.get('z') || '').match(/video(-?\d+)_(\d+)/);
    const m = fromPath || fromQuery;
    if (m) {
      return normalizeVkVideoEmbed(`https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}`);
    }
  } catch {
    return null;
  }
  return null;
}

async function deleteItem(formData: FormData) {
  'use server';
  await requirePermission(['news', 'pages']);
  const id = formData.get('id') as string;
  try {
    await prisma.news.delete({ where: { id } });
    revalidatePath('/admin/news');
    revalidatePath('/news');
  } catch (e) {
    console.error('news delete error', e);
  }
}

async function resolveNewsImage(formData: FormData) {
  const file = formData.get('imageFile') as File | null;
  // CoverImageField hiddenName="imageUrl"; empty string clears the cover.
  const existing = (formData.get('imageUrl') as string) || '';
  return saveUploadedImage(file, 'news', existing.trim());
}

async function createItem(formData: FormData) {
  'use server';
  await requirePermission(['news', 'pages']);
  try {
    const title = (formData.get('title') as string) || '';
    const text = (formData.get('text') as string) || '';
    if (!text.trim()) return;
    assertCleanText(title, text);
    const imageUrl = (await resolveNewsImage(formData)) || null;
    const videoEmbedUrl = resolveVideoEmbed(formData);
    const { status, publishedAt } = parsePublishFields(formData);
    await prisma.news.create({
      data: {
        title: title.trim() || null,
        text: text.trim(),
        imageUrl,
        videoEmbedUrl,
        status,
        publishedAt,
      },
    });
    revalidatePath('/admin/news');
    revalidatePath('/news');
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('news create error', e);
  }
  redirect('/admin/news');
}

async function updateItem(formData: FormData) {
  'use server';
  await requirePermission(['news', 'pages']);
  const id = formData.get('id') as string;
  try {
    const title = (formData.get('title') as string) || '';
    const text = (formData.get('text') as string) || '';
    assertCleanText(title, text);
    const imageUrl = (await resolveNewsImage(formData)) || null;
    const videoEmbedUrl = resolveVideoEmbed(formData);
    const { status, publishedAt } = parsePublishFields(formData);
    await prisma.news.update({
      where: { id },
      data: {
        title: title.trim() || null,
        text: text.trim(),
        imageUrl,
        videoEmbedUrl,
        status,
        publishedAt,
      },
    });
    revalidatePath('/admin/news');
    revalidatePath('/news');
  } catch (e) {
    if (e instanceof ProfanityError) throw e;
    console.error('news update error', e);
  }
  redirect('/admin/news');
}


async function bulkDeleteNews(formData: FormData) {
  'use server';
  await requirePermission(['news', 'pages']);
  const ids = formData.getAll('ids').map(String).filter(Boolean);
  for (const id of ids) {
    const fd = new FormData();
    fd.set('id', id);
    await deleteItem(fd);
  }
}

export default async function AdminNews({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; add?: string }>;
}) {
  await requirePermissionPage(['news', 'pages']);
  const params = await searchParams;
  let items: any[] = [];
  try {
    items = await prisma.news.findMany({ orderBy: { createdAt: 'desc' } });
  } catch {
    items = [];
  }

  const editId = params.edit;
  const editing = editId ? items.find((n) => n.id === editId) : null;
  const showForm = params.add === '1' || !!editing;

  return (
    <div className="admin-page-shell" style={{ paddingBottom: '4rem' }}>
      <div className="admin-page-header">
        <div>
          <h1>Новости</h1>
          <p>Публикации на сайте</p>
        </div>
        {!showForm && (
          <Link href="/admin/news?add=1" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
            <Plus size={18} /> Добавить
          </Link>
        )}
      </div>

      {showForm && (
        <NewsDraftForm
          action={editing ? updateItem : createItem}
          editingId={editing?.id}
          initial={{
            title: editing?.title || '',
            text: editing?.text || '',
            imageUrl: editing?.imageUrl || null,
            videoEmbedUrl: editing?.videoEmbedUrl || '',
            status: editing?.status || 'PUBLISHED',
            publishedAt: editing?.publishedAt ? new Date(editing.publishedAt).toISOString().slice(0, 16) : '',
          }}
        />
      )}

      <NewsListBoard
        rows={items.map((n) => ({
          id: n.id,
          title: n.title,
          text: n.text,
          status: n.status,
          publishedAt: n.publishedAt ? new Date(n.publishedAt).toISOString() : null,
          createdAt: new Date(n.createdAt).toISOString(),
          videoEmbedUrl: n.videoEmbedUrl,
        }))}
        deleteItem={deleteItem}
        bulkDelete={bulkDeleteNews}
      />
    </div>
  );
}
