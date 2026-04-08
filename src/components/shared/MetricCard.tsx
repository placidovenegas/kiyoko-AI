'use client';

import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

const TONE_STYLES: Record<string, { icon: string; value: string }> = {
  default: { icon: 'bg-muted text-muted-foreground', value: 'text-foreground' },
  primary: { icon: 'bg-primary/10 text-primary', value: 'text-primary' },
  success: { icon: 'bg-emerald-500/10 text-emerald-500', value: 'text-emerald-500' },
  warning: { icon: 'bg-amber-500/10 text-amber-500', value: 'text-amber-500' },
  danger: { icon: 'bg-danger-500/10 text-danger-500', value: 'text-danger-500' },
  info: { icon: 'bg-sky-500/10 text-sky-500', value: 'text-sky-500' },
};

interface MetricCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  helper?: string;
  tone?: keyof typeof TONE_STYLES;
  className?: string;
}

export function MetricCard({ icon: Icon, label, value, helper, tone = 'default', className }: MetricCardProps) {
  const styles = TONE_STYLES[tone] ?? TONE_STYLES.default;

  return (
    <div className={cn('rounded-2xl border border-border bg-card p-5 shadow-sm', className)}>
      <div className="flex items-start gap-3">
        <div className={cn('flex items-center justify-center size-10 rounded-xl shrink-0', styles.icon)}>
          <Icon className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</p>
          <p className={cn('mt-1 text-2xl font-semibold tracking-tight', styles.value)}>{value}</p>
          {helper && <p className="mt-0.5 text-xs text-muted-foreground">{helper}</p>}
        </div>
      </div>
    </div>
  );
}
