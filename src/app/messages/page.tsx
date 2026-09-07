import { redirect } from 'next/navigation';

type Sp = Record<string, string | string[] | undefined>;

export default async function MessagesAliasPage({
  searchParams,
}: {
  searchParams?: Promise<Sp>;
}) {
  const sp = (await searchParams) || {};
  const q = new URLSearchParams();
  for (const [key, value] of Object.entries(sp)) {
    if (Array.isArray(value)) value.forEach((v) => q.append(key, v));
    else if (value) q.set(key, value);
  }
  const suffix = q.toString();
  redirect(suffix ? `/dashboard/messages?${suffix}` : '/dashboard/messages');
}
