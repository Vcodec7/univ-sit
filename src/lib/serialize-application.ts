export type AppRow = {
  id: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | string;
  message: string | null;
  rejectReason: string | null;
  createdAt: string;
  typeLabel: string;
  title: string;
  userName: string;
  userEmail: string | null;
};

function typeLabel(app: {
  project?: { title?: string | null } | null;
  club?: { title?: string | null } | null;
  program?: { title?: string | null; kind?: string | null } | null;
}) {
  if (app.project) return 'Проект';
  if (app.club) return 'Клуб';
  if (app.program?.kind === 'GRANT') return 'Грант';
  if (app.program?.kind === 'DOBRO') return 'Добро';
  if (app.program?.kind === 'SELF_GOV') return 'Самоупр.';
  if (app.program) return 'Программа';
  return 'Заявка';
}

/** Must live on the server — ApplicationsBoard is a Client Component. */
export function serializeApp(app: {
  id: string;
  status: string;
  message?: string | null;
  rejectReason?: string | null;
  createdAt?: Date | string | null;
  project?: { title?: string | null } | null;
  club?: { title?: string | null } | null;
  program?: { title?: string | null; kind?: string | null } | null;
  user?: { name?: string | null; email?: string | null } | null;
}): AppRow {
  return {
    id: app.id,
    status: app.status,
    message: app.message || null,
    rejectReason: app.rejectReason || null,
    createdAt: app.createdAt ? new Date(app.createdAt).toISOString() : '',
    typeLabel: typeLabel(app),
    title: app.project?.title || app.club?.title || app.program?.title || '—',
    userName: app.user?.name || app.user?.email || '—',
    userEmail: app.user?.email || null,
  };
}
