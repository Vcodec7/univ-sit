'use client';

import type { ButtonHTMLAttributes, ReactNode } from 'react';

export default function ConfirmSubmitButton({
  message,
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { message: string; children: ReactNode }) {
  return (
    <button
      type="submit"
      {...rest}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
        rest.onClick?.(e);
      }}
    >
      {children}
    </button>
  );
}
