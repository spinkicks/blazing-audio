import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: ReactNode;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-2xl font-semibold transition ' +
  'active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100 ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-wave-400/70';

const variants: Record<Variant, string> = {
  primary: 'bg-amp-500 text-ink-950 hover:bg-amp-400',
  secondary: 'bg-ink-700 text-slate-100 hover:bg-ink-600',
  ghost: 'bg-transparent text-slate-300 hover:bg-ink-700',
  danger: 'bg-clip-500 text-white hover:bg-clip-400',
};

const sizes: Record<Size, string> = {
  md: 'min-h-[44px] px-4 text-sm',
  lg: 'min-h-[52px] px-6 text-base',
};

export function Button({
  variant = 'primary',
  size = 'lg',
  fullWidth,
  className,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={cn(base, variants[variant], sizes[size], fullWidth && 'w-full', className)}
      {...rest}
    >
      {children}
    </button>
  );
}
