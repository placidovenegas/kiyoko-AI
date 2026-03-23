import { cn } from '@/lib/utils/cn';
import { KiyokoLogo } from '@/components/shared/KiyokoLogo';

interface AuthCardProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-white/10 bg-white/3 p-8 shadow-2xl backdrop-blur-xl',
        'lg:border-border lg:bg-card lg:backdrop-blur-none',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function AuthHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-8 text-center">
      <div className="mx-auto mb-4">
        <KiyokoLogo variant="dark" size={48} className="mx-auto" />
      </div>
      <h1 className="text-xl font-bold text-foreground lg:text-foreground">
        <span className="text-white lg:text-foreground">{title}</span>
      </h1>
      <p className="mt-1 text-sm text-white/50 lg:text-muted-foreground">{subtitle}</p>
    </div>
  );
}

export function AuthError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
      {message}
    </div>
  );
}
