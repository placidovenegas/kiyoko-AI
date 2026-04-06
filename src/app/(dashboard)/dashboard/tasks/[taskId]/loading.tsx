export default function TaskDetailLoading() {
  return (
    <div className="space-y-6 px-4 py-5 lg:px-6 animate-pulse">
      <div className="h-24 rounded-[28px] border border-border bg-card" />
      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="h-[70vh] rounded-[28px] border border-border bg-card" />
        <div className="h-[70vh] rounded-[28px] border border-border bg-card" />
      </div>
    </div>
  );
}
