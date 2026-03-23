export function AuthDivider() {
  return (
    <div className="flex items-center gap-3 py-4">
      <div className="h-px flex-1 bg-white/10 lg:bg-secondary" />
      <span className="text-xs text-white/30 lg:text-muted-foreground">o</span>
      <div className="h-px flex-1 bg-white/10 lg:bg-secondary" />
    </div>
  );
}
