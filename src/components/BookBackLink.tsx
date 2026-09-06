'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

export default function BookBackLink({
  spaceId,
  fromList,
}: {
  spaceId: string;
  fromList?: boolean;
}) {
  const router = useRouter();
  const spaceHref = `/spaces/${encodeURIComponent(spaceId)}`;

  return (
    <button
      type="button"
      className="book-back-link"
      onClick={() => {
        if (fromList) {
          router.push('/spaces');
          return;
        }
        const ref = typeof document !== 'undefined' ? document.referrer : '';
        if (ref.includes('/spaces') && !ref.includes('/book')) {
          router.back();
          return;
        }
        router.push(spaceHref);
      }}
    >
      <ArrowLeft size={16} aria-hidden />
      {fromList ? 'К списку площадок' : 'К площадке'}
    </button>
  );
}
