export default function AdminLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-secondary" />
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-10 w-full animate-pulse rounded-lg bg-secondary" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-14 w-full animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
    </div>
  );
}
