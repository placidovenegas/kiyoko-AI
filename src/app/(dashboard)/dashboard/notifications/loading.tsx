export default function DashboardInboxLoading() {
  return (
    <div className="space-y-6 px-3 py-4 lg:px-5 animate-pulse">
      <div className="h-48 rounded-[28px] border border-border bg-card" />
      <div className="space-y-3 rounded-2xl border border-border bg-card p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div key={index} className="h-24 rounded-2xl border border-border bg-background/70" />
        ))}
      </div>
    </div>
  );
}