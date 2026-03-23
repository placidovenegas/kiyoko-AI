export default function PublicationsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
        <div className="h-9 w-36 animate-pulse rounded-lg bg-secondary" />
      </div>
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={`header-${i}`} className="h-8 animate-pulse rounded bg-secondary" />
        ))}
        {Array.from({ length: 35 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    </div>
  );
}
