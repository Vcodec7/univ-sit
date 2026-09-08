'use client';

import { useEffect, useRef, useState, type FormHTMLAttributes, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import {
  ADMIN_DRAFT_INTERVAL_MS,
  adminDraftKey,
  applyNamedForm,
  clearAdminDraft,
  readAdminDraft,
  serializeNamedForm,
  writeAdminDraft,
} from '@/lib/use-admin-draft';
import AdminDraftBanner from '@/components/admin/AdminDraftBanner';

type Props = FormHTMLAttributes<HTMLFormElement> & {
  entity: string;
  children: ReactNode;
};

export default function AdminDraftForm({ entity, children, onSubmit, ...rest }: Props) {
  const path = usePathname() || '/admin';
  const key = adminDraftKey(path, entity);
  const formRef = useRef<HTMLFormElement>(null);
  const snapshot = useRef<Record<string, string> | null>(null);
  const [restored, setRestored] = useState(false);

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    snapshot.current = serializeNamedForm(form);
    const draft = readAdminDraft<Record<string, string>>(key);
    if (draft && Object.keys(draft).length) {
      applyNamedForm(form, draft);
      setRestored(true);
    }
  }, [key]);

  useEffect(() => {
    const t = window.setInterval(() => {
      const form = formRef.current;
      if (!form) return;
      writeAdminDraft(key, serializeNamedForm(form));
    }, ADMIN_DRAFT_INTERVAL_MS);
    return () => window.clearInterval(t);
  }, [key]);

  function discard() {
    const form = formRef.current;
    if (form && snapshot.current) applyNamedForm(form, snapshot.current);
    clearAdminDraft(key);
    setRestored(false);
  }

  return (
    <>
      {restored ? <AdminDraftBanner onDiscard={discard} /> : null}
      <form
        {...rest}
        ref={formRef}
        data-admin-draft={key}
        onSubmit={(e) => {
          clearAdminDraft(key);
          onSubmit?.(e);
        }}
      >
        {children}
      </form>
    </>
  );
}
