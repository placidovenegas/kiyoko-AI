'use client';

import { forwardRef, type HTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  header?: ReactNode;
  footer?: ReactNode;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, header, footer, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'rounded-xl bg-card shadow-card transition-shadow duration-200 hover:shadow-card-hover',
          'border border-muted-foreground/10',
          className,
        )}
        {...props}
      >
        {header && (
          <div className="border-b border-muted-foreground/10 px-6 py-4">
            {header}
          </div>
        )}
        <div className="px-6 py-4">{children}</div>
        {footer && (
          <div className="border-t border-muted-foreground/10 px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    );
  },
);

Card.displayName = 'Card';
