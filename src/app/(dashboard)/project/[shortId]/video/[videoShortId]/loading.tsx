export default function VideoLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 animate-pulse rounded-xl bg-secondary" />
        <div className="space-y-2">
          <div className="h-6 w-48 animate-pulse rounded bg-secondary" />
          <div className="h-4 w-32 animate-pulse rounded bg-secondary" />
        </div>
      </div>
      <div className="h-3 w-full animate-pulse rounded-full bg-secondary" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="aspect-[3/4] animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
    </div>
  );
}
