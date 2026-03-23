export default function TasksLoading() {
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div className="h-8 w-32 animate-pulse rounded bg-secondary" />
        <div className="h-9 w-28 animate-pulse rounded-lg bg-secondary" />
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="space-y-3">
            <div className="h-6 w-28 animate-pulse rounded bg-secondary" />
            {Array.from({ length: 3 }).map((_, row) => (
              <div key={row} className="h-28 animate-pulse rounded-xl bg-secondary" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
