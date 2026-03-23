export default function SceneLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center gap-3">
        <div className="h-5 w-24 animate-pulse rounded bg-secondary" />
        <div className="h-6 w-64 animate-pulse rounded bg-secondary" />
      </div>
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="h-32 animate-pulse rounded-xl bg-secondary" />
          <div className="aspect-video animate-pulse rounded-xl bg-secondary" />
          <div className="h-24 animate-pulse rounded-xl bg-secondary" />
        </div>
        <div className="space-y-4">
          <div className="h-40 animate-pulse rounded-xl bg-secondary" />
          <div className="h-32 animate-pulse rounded-xl bg-secondary" />
          <div className="h-24 animate-pulse rounded-xl bg-secondary" />
        </div>
      </div>
    </div>
  );
}
