'use client';

import { cn } from '@/lib/utils/cn';

function getStrength(password: string): { score: number; label: string; color: string } {
  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 10) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { score, label: 'Muy débil', color: 'bg-red-500' };
  if (score === 2) return { score, label: 'Débil', color: 'bg-orange-500' };
  if (score === 3) return { score, label: 'Aceptable', color: 'bg-yellow-500' };
  if (score === 4) return { score, label: 'Fuerte', color: 'bg-green-500' };
  return { score, label: 'Muy fuerte', color: 'bg-emerald-500' };
}

export function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const { score, label, color } = getStrength(password);

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className={cn(
              'h-1 flex-1 rounded-full transition-colors',
              i <= score ? color : 'bg-secondary',
            )}
          />
        ))}
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}
