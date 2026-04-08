'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface FilterOption {
  id: string;
  label: string;
  count?: number;
  icon?: LucideIcon;
}

interface FilterPillsProps {
  filters: FilterOption[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function FilterPills({ filters, active, onChange, className }: FilterPillsProps) {
  return (
    <div className={cn('flex flex-wrap items-center gap-1.5', className)}>
      {filters.map((filter) => {
        const isActive = active === filter.id;
        const Icon = filter.icon;
        return (
          <button
            key={filter.id}
            type="button"
            onClick={() => onChange(filter.id)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors',
              isActive
                ? 'bg-primary text-white'
                : 'bg-secondary text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
          >
            {Icon && <Icon className="size-3" />}
            {filter.label}
            {filter.count != null && (
              <span className={cn(
                'ml-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold tabular-nums',
                isActive ? 'bg-white/20' : 'bg-muted',
              )}>
                {filter.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
