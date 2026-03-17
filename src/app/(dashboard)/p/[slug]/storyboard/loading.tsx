export default function StoryboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-48 rounded bg-surface-tertiary animate-pulse" />
          <div className="mt-1.5 h-3 w-32 rounded bg-surface-tertiary animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-8 w-24 rounded-lg bg-surface-tertiary animate-pulse" />
          <div className="h-8 w-28 rounded-lg bg-surface-tertiary animate-pulse" />
        </div>
      </div>
      {/* Stats skeleton */}
      <div className="grid grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4 text-center">
            <div className="mx-auto h-7 w-10 rounded bg-surface-tertiary animate-pulse" />
            <div className="mx-auto mt-1.5 h-3 w-16 rounded bg-surface-tertiary animate-pulse" />
          </div>
        ))}
      </div>
      {/* Filters skeleton */}
      <div className="flex gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-6 w-20 rounded-full bg-surface-tertiary animate-pulse" />
        ))}
      </div>
      {/* Scene cards skeleton */}
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-border/10 bg-surface-secondary p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-5 w-8 rounded bg-surface-tertiary animate-pulse" />
            <div className="h-5 w-40 rounded bg-surface-tertiary animate-pulse" />
            <div className="flex-1" />
            <div className="h-5 w-16 rounded-full bg-surface-tertiary animate-pulse" />
            <div className="h-5 w-16 rounded-full bg-surface-tertiary animate-pulse" />
          </div>
          <div className="flex gap-4">
            <div className="w-56 h-32 rounded-lg bg-surface-tertiary animate-pulse shrink-0" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-full rounded bg-surface-tertiary animate-pulse" />
              <div className="h-3 w-3/4 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-surface-tertiary animate-pulse" />
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="h-3 w-24 rounded bg-surface-tertiary animate-pulse" />
            <div className="h-16 w-full rounded-lg bg-surface-tertiary animate-pulse" />
          </div>
        </div>
      ))}
    </div>
  );
}
