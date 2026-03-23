export default function NewProjectLoading() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="h-8 w-48 rounded-lg bg-secondary" />
      <div className="flex gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-secondary" />
            <div className="h-4 w-16 rounded bg-secondary" />
          </div>
        ))}
      </div>
      <div className="h-96 rounded-2xl bg-secondary" />
    </div>
  );
}
