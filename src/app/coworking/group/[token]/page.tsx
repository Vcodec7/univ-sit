import type { Metadata } from 'next';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { getSiteIdentity } from '@/lib/site-identity';
import { findGroupByToken, serializeCoworkingGroup, type GroupSignupRow } from '@/lib/coworking-group';
import CoworkingGroupJoin from '@/components/CoworkingGroupJoin';

export async function generateMetadata(): Promise<Metadata> {
  const { siteName } = await getSiteIdentity();
  return { title: `Открытая группа коворкинга | ${siteName}` };
}

export default async function CoworkingGroupPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const session = await getServerSession(authOptions);
  const row = await findGroupByToken(token);
  if (!row) {
    return (
      <div className="container cw-page">
        <h1>Группа не найдена</h1>
        <p>Ссылка недействительна или набор уже закрыт.</p>
      </div>
    );
  }
  const group = serializeCoworkingGroup(row as GroupSignupRow, session?.user?.id);
  const callback = `/coworking/group/${encodeURIComponent(token)}`;
  return (
    <div className="container cw-page">
      <header className="cw-page-head">
        <p className="cw-eyebrow">Коворкинг</p>
        <h1>Открытая группа</h1>
      </header>
      <CoworkingGroupJoin
        initialGroup={group}
        loggedIn={Boolean(session?.user?.id)}
        loginHref={`/login?callbackUrl=${encodeURIComponent(callback)}`}
      />
    </div>
  );
}
