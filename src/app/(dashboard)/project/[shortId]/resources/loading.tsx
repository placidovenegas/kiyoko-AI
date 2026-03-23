export default function ResourcesLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-40 animate-pulse rounded bg-secondary" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    </div>
  );
}
