import type { ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

/** Shared CTA. Maps to existing `.btn` tokens plus `.yp-btn` sizes/focus. */
export default function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  ...rest
}: Props) {
  const variantClass =
    variant === 'primary'
      ? 'btn-primary'
      : variant === 'secondary'
        ? 'btn-secondary'
        : variant === 'ghost'
          ? 'btn-ghost'
          : variant === 'danger'
            ? 'btn-danger'
            : 'btn-outline';
  return (
    <button
      type={type}
      className={cn('btn', 'yp-btn', `yp-btn--${size}`, variantClass, className)}
      {...rest}
    />
  );
}
