'use client';

import { useState } from 'react';
import { splitMessageBodyMedia } from '@/lib/message-body-media';
import MessageSafeLink from '@/components/MessageSafeLink';

type Props = {
  body: string;
  className?: string;
};

/**
 * Chat text with image/gif URL → compact preview (fallback: gated link).
 */
export default function MessageBodyText({ body, className }: Props) {
  const parts = splitMessageBodyMedia(body);

  return (
    <div className={className}>
      {parts.map((part, i) => {
        if (part.type === 'text') {
          return (
            <span key={i} className="msg-body-text">
              {part.value}
            </span>
          );
        }
        if (part.type === 'link') {
          return <MessageSafeLink key={i} href={part.url} />;
        }
        return <MsgImagePreview key={i} url={part.url} />;
      })}
    </div>
  );
}

function MsgImagePreview({ url }: { url: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) {
    return <MessageSafeLink href={url}>Изображение</MessageSafeLink>;
  }
  return (
    <MessageSafeLink href={url} className="msg-body-media msg-body-link--gate">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt="" loading="lazy" decoding="async" onError={() => setFailed(true)} />
    </MessageSafeLink>
  );
}
