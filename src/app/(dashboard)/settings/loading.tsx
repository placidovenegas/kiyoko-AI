export default function SettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-40 animate-pulse rounded bg-secondary" />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-9 w-28 animate-pulse rounded-lg bg-secondary" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 w-24 animate-pulse rounded bg-secondary" />
            <div className="h-10 w-full animate-pulse rounded-lg bg-secondary" />
          </div>
        ))}
      </div>
      <div className="h-10 w-32 animate-pulse rounded-lg bg-secondary" />
    </div>
  );
}
