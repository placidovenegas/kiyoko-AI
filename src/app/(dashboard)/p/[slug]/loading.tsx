export default function ProjectLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-xl bg-surface-tertiary" />
        ))}
      </div>
      <div className="h-64 rounded-2xl bg-surface-tertiary" />
      <div className="grid gap-6 md:grid-cols-2">
        <div className="h-48 rounded-xl bg-surface-tertiary" />
        <div className="h-48 rounded-xl bg-surface-tertiary" />
      </div>
    </div>
  );
}
