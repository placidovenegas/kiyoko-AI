export default function ProjectSettingsLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="h-8 w-48 animate-pulse rounded bg-secondary" />
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
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
