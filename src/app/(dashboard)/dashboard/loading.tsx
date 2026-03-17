export default function DashboardLoading() {
  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Stats skeleton */}
      <div className="grid grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary p-4">
            <div className="h-8 w-12 rounded bg-surface-tertiary animate-pulse" />
            <div className="mt-2 h-3 w-20 rounded bg-surface-tertiary animate-pulse" />
          </div>
        ))}
      </div>
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="h-7 w-40 rounded bg-surface-tertiary animate-pulse" />
        <div className="h-9 w-32 rounded-lg bg-surface-tertiary animate-pulse" />
      </div>
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-surface-secondary overflow-hidden">
            <div className="h-40 bg-surface-tertiary animate-pulse" />
            <div className="p-4 space-y-2">
              <div className="h-4 w-3/4 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-3 w-1/2 rounded bg-surface-tertiary animate-pulse" />
              <div className="h-2 w-full rounded-full bg-surface-tertiary animate-pulse mt-3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
