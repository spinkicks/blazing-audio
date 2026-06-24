import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '@/lib/cn';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export function Card({ className, children, ...rest }: CardProps) {
  return (
    <div
      className={cn(
        'border border-white/5 bg-ink-800/80 p-5 shadow-lg backdrop-blur',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}
