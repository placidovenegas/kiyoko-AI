export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-500/10 via-surface to-brand-900/10">
      <div className="w-full max-w-md px-4">
        {children}
      </div>
    </div>
  );
}
