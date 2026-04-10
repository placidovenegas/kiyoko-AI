'use client';

import { cn } from '@/lib/utils/cn';
import type { StreamingSkeletonVariant } from '@/components/chat/chatDockOverlay';

/**
 * Animated Kiyoko logo SVG — draws itself like a pen stroke.
 * Used as AI thinking/generating indicator.
 *
 * Shows the animated SVG logo + pulsing dots + contextual label.
 * Always visible during streaming; serves as the primary "alive" indicator.
 */
export function StreamingWave({ label = 'Generando' }: { label?: string }) {
  return (
    <div className="flex items-center gap-2.5 py-1.5">
      <div className="w-8 h-5 overflow-hidden shrink-0">
        <svg
          viewBox="0 0 545.48 357.17"
          className="w-full h-full"
          preserveAspectRatio="xMidYMid meet"
        >
          <path
            d="M.03,204.61c21.57-.15,43.15-.34,64.72-.59,20.61-.24,42.05,1.02,62.46-2.27,34.94-5.62,67.44-36.22,61.92-73.71-2.83-19.23-13.06-36.35-16.42-55.43s1.9-35.23,14.95-48.71c10.29-10.63,28.9-23.7,44.72-18.87,14.87,4.54,9.82,28.05,7.97,38.84-3.46,20.13-9.4,39.91-10.7,60.37-1.1,17.35,1.92,35.49,16.91,46.28,12.34,8.88,30.05,8.36,38.53-5.35s9.42-33.37,11.6-49.35c2.38-17.51,4.94-36.29,14.29-51.68s24.57-21.93,41.7-23.59c13.9-1.35,29.52-.91,42.75,4.09,5.36,2.03,10.65,5.06,14.05,9.81,4.1,5.72,4.06,12.43,2.73,19.08-3.7,18.62-15.01,34.31-26.85,48.67s-25.99,28.79-40.72,41.23c-13.94,11.77-29.57,21.49-46.36,28.65-17.46,7.44-36.18,11.25-53.69,18.55-34.68,14.47-59.78,45.75-73.47,80.08-10.06,25.22-21.18,76.31,17.93,81.92,32.25,4.62,59.53-21.31,67.23-50.95,2.22-8.54,2.9-17.45,1.14-26.14-1.87-9.29-6.64-16.98-10.66-25.39-3.43-7.17-5.15-14.82-2.24-22.46,2.01-5.29,5.17-10.4,9.07-14.5,3.12-3.27,7.88-7.01,12.66-5.11,6.47,2.57,8.85,12.65,10.27,18.61,4.57,19.13,5.49,39.17,9.26,58.49,3.42,17.55,7.96,36.55,19.46,50.74s28.18,16.28,45.36,16.15c18.27-.15,37.56.76,55.52-3.19,5.98-1.31,14.17-4.51,13.77-11.97-.47-8.83-10.86-16.92-16.66-22.58-28.53-27.87-55.87-57.54-75.23-92.71-5.08-9.23-13.66-23.53-10.91-34.76,1.38-5.63,6.45-6.86,11.65-6.35,10.07.98,19.83,5.08,29.51,7.82,20.23,5.74,40.79,9.87,61.7,12.14,20.96,2.28,41.84,2.15,62.89,2.07s41.73.21,62.59.4"
            fill="none"
            stroke="currentColor"
            strokeWidth="14"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/50 animate-draw-logo"
          />
        </svg>
      </div>
      <span className="text-xs text-muted-foreground/70 select-none animate-pulse">{label}</span>
    </div>
  );
}

const shell = cn(
  'mt-2 rounded-xl border overflow-hidden animate-pulse',
  'border-border/80 bg-muted/40 dark:bg-muted/25',
  'shadow-[inset_0_1px_0_0_rgba(255,255,255,0.04)]',
);

const bar = 'rounded-md bg-muted-foreground/15';
const pill = 'rounded-full bg-muted-foreground/12';

/**
 * Skeleton contextual: imita la forma del componente que va a montarse.
 */
export function ComponentLoadingSkeleton({ variant }: { variant: StreamingSkeletonVariant }) {
  switch (variant) {
    case 'create-character':
      return (
        <div className={shell}>
          <div className="flex items-start gap-3 p-4 border-b border-border/50">
            <div className={cn('size-12 shrink-0 rounded-lg', bar)} />
            <div className="flex-1 space-y-2 min-w-0 pt-0.5">
              <div className={cn('h-3 w-36', bar)} />
              <div className={cn('h-2.5 w-full max-w-56', bar)} />
              <div className={cn('h-2.5 w-4/5 max-w-48', bar)} />
            </div>
          </div>
          <div className="px-4 py-2.5 space-y-2">
            <div className={cn('h-8 w-full', bar)} />
            <div className={cn('h-8 w-full', bar)} />
          </div>
        </div>
      );

    case 'create-background':
      return (
        <div className={shell}>
          <div className={cn('h-24 w-full', bar)} />
          <div className="p-4 space-y-2">
            <div className={cn('h-3 w-40', bar)} />
            <div className={cn('h-2.5 w-full', bar)} />
            <div className="flex gap-2 mt-2">
              <div className={cn('h-7 flex-1', bar)} />
              <div className={cn('h-7 flex-1', bar)} />
            </div>
          </div>
        </div>
      );

    case 'create-video':
      return (
        <div className={shell}>
          <div className="p-4 space-y-3 border-b border-border/50">
            <div className={cn('h-3.5 w-48', bar)} />
            <div className="flex flex-wrap gap-2">
              <div className={cn('h-7 w-24', pill)} />
              <div className={cn('h-7 w-20', pill)} />
              <div className={cn('h-7 w-16', pill)} />
            </div>
            <div className={cn('h-16 w-full', bar)} />
          </div>
          <div className="px-4 py-3 flex justify-end gap-2">
            <div className={cn('h-8 w-20', bar)} />
            <div className={cn('h-8 w-28', bar)} />
          </div>
        </div>
      );

    case 'create-project':
      return (
        <div className={shell}>
          <div className="p-4 space-y-3 border-b border-border/50">
            <div className={cn('h-3.5 w-52', bar)} />
            <div className={cn('h-9 w-full', bar)} />
            <div className={cn('h-9 w-full', bar)} />
            <div className={cn('h-14 w-full', bar)} />
          </div>
          <div className="px-4 py-3 flex justify-end gap-2">
            <div className={cn('h-8 w-20', bar)} />
            <div className={cn('h-8 w-28', bar)} />
          </div>
        </div>
      );

    case 'project-summary':
    case 'video-summary':
      return (
        <div className={shell}>
          <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-border/50">
            <div className={cn('h-4 w-44', bar)} />
            <div className={cn('h-6 w-16 rounded-full', bar)} />
          </div>
          <div className="p-4 grid grid-cols-3 gap-2">
            <div className={cn('h-14 rounded-lg', bar)} />
            <div className={cn('h-14 rounded-lg', bar)} />
            <div className={cn('h-14 rounded-lg', bar)} />
          </div>
          <div className="px-4 pb-4 space-y-2">
            <div className={cn('h-2.5 w-full', bar)} />
            <div className={cn('h-2.5 w-5/6', bar)} />
          </div>
        </div>
      );

    case 'scene-detail':
      return (
        <div className={shell}>
          <div className="px-4 py-3 border-b border-border/50 space-y-2">
            <div className={cn('h-3.5 w-52', bar)} />
            <div className="flex gap-2">
              <div className={cn('h-6 w-20', pill)} />
              <div className={cn('h-6 w-24', pill)} />
            </div>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className={cn('h-24 rounded-lg', bar)} />
            <div className="space-y-2">
              <div className={cn('h-2.5 w-full', bar)} />
              <div className={cn('h-2.5 w-4/5', bar)} />
              <div className={cn('h-2.5 w-full', bar)} />
            </div>
          </div>
        </div>
      );

    case 'resource-list':
      return (
        <div className={shell}>
          <div className="px-4 py-2.5 border-b border-border/50">
            <div className={cn('h-3 w-32', bar)} />
          </div>
          <div className="p-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className={cn('aspect-4/3 rounded-lg', bar)} />
            ))}
          </div>
        </div>
      );

    case 'scene-plan':
      return (
        <div className={shell}>
          <div className="px-4 py-2.5 border-b border-border/50">
            <div className={cn('h-3 w-40', bar)} />
          </div>
          <div className="p-3 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2 items-center">
                <div className={cn('h-8 w-8 shrink-0 rounded-md', bar)} />
                <div className="flex-1 space-y-1.5">
                  <div className={cn('h-2.5 w-3/4', bar)} />
                  <div className={cn('h-2 w-1/2', bar)} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );

    case 'options':
    case 'workflow':
      return (
        <div className={shell}>
          <div className="p-3 flex flex-wrap gap-2">
            <div className={cn('h-8 w-28', bar)} />
            <div className={cn('h-8 w-32', bar)} />
            <div className={cn('h-8 w-24', bar)} />
          </div>
        </div>
      );

    case 'choices':
      return (
        <div className={shell}>
          <div className="p-3 space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg border border-border/40">
                <div className={cn('size-4 rounded border shrink-0', bar)} />
                <div className={cn('h-2.5 flex-1', bar)} />
              </div>
            ))}
          </div>
        </div>
      );

    case 'prompt-preview':
      return (
        <div className={shell}>
          <div className="px-3 py-2 border-b border-border/50">
            <div className={cn('h-2.5 w-28', bar)} />
          </div>
          <div className="p-3 space-y-2 font-mono">
            <div className={cn('h-2 w-full', bar)} />
            <div className={cn('h-2 w-[95%]', bar)} />
            <div className={cn('h-2 w-[88%]', bar)} />
            <div className={cn('h-2 w-[92%]', bar)} />
          </div>
        </div>
      );

    case 'select':
      return (
        <div className={shell}>
          <div className="p-3 space-y-2">
            <div className={cn('h-9 w-full rounded-lg', bar)} />
            <div className={cn('h-2.5 w-48', bar)} />
          </div>
        </div>
      );

    case 'action-plan':
      return (
        <div className={shell}>
          <div className="px-4 py-2.5 border-b border-border/50">
            <div className={cn('h-3 w-44', bar)} />
          </div>
          <div className="p-4 space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex gap-2">
                <div className={cn('h-2.5 w-2.5 shrink-0 mt-0.5 rounded-sm', bar)} />
                <div className={cn('h-2.5 flex-1', bar)} />
              </div>
            ))}
          </div>
          <div className="px-4 pb-4 flex justify-end">
            <div className={cn('h-9 w-36 rounded-lg', bar)} />
          </div>
        </div>
      );

    case 'audio':
      return (
        <div className={cn(shell, 'p-3')}>
          <div className="flex items-center gap-2">
            <div className={cn('h-7 flex-1 rounded-md', bar)} />
            <div className={cn('h-7 w-7 rounded-md shrink-0', bar)} />
          </div>
        </div>
      );

    case 'generic':
    default:
      return (
        <div className={shell}>
          <div className="flex items-center gap-2 px-4 py-2.5 bg-muted/30 border-b border-border/50">
            <div className="size-3.5 rounded bg-muted-foreground/20" />
            <div className="h-3 w-28 rounded bg-muted-foreground/20" />
          </div>
          <div className="p-4 space-y-2.5">
            <div className="h-2.5 w-full rounded bg-muted-foreground/10" />
            <div className="h-2.5 w-3/4 rounded bg-muted-foreground/10" />
            <div className="grid grid-cols-2 gap-2 mt-3">
              <div className="h-8 rounded bg-muted-foreground/10" />
              <div className="h-8 rounded bg-muted-foreground/10" />
            </div>
          </div>
        </div>
      );
  }
}

/**
 * @deprecated Prefer ComponentLoadingSkeleton con variant desde streamingSkeletonVariant()
 */
export function BlockSkeleton({ type }: { type?: string }) {
  const variant: StreamingSkeletonVariant =
    type === 'summary' ? 'project-summary'
    : type === 'scene' ? 'scene-detail'
    : type === 'resources' ? 'resource-list'
    : type === 'video' ? 'video-summary'
    : 'generic';

  return <ComponentLoadingSkeleton variant={variant} />;
}
