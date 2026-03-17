'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export function Breadcrumbs({ items }: BreadcrumbsProps) {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumbs" className="flex items-center gap-1.5 text-sm">
      {items.map((item, idx) => {
        const isLast = idx === items.length - 1;

        return (
          <span key={idx} className="flex items-center gap-1.5">
            {idx > 0 && (
              <span className="text-foreground-muted select-none" aria-hidden>
                ›
              </span>
            )}

            {isLast || !item.href ? (
              <span
                className={cn(
                  isLast ? 'font-semibold text-foreground' : 'text-foreground-muted',
                )}
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                className="text-foreground-muted hover:text-foreground transition-colors"
              >
                {item.label}
              </Link>
            )}
          </span>
        );
      })}
    </nav>
  );
}
