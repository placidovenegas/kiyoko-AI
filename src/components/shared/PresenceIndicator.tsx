'use client';

import { cn } from '@/lib/utils/cn';

interface OnlineUser {
  id: string;
  name: string;
  avatar_url: string | null;
}

interface PresenceIndicatorProps {
  users: OnlineUser[];
  maxVisible?: number;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function PresenceIndicator({ users, maxVisible = 4 }: PresenceIndicatorProps) {
  if (users.length === 0) return null;

  const visible = users.slice(0, maxVisible);
  const overflow = users.length - maxVisible;

  return (
    <div className="flex items-center -space-x-1.5">
      {visible.map((user) => (
        <div
          key={user.id}
          title={user.name}
          className={cn(
            'relative size-6 rounded-full border-2 border-surface flex items-center justify-center',
            'bg-primary/20 text-primary',
          )}
        >
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.name}
              className="size-full rounded-full object-cover"
            />
          ) : (
            <span className="text-[8px] font-bold">{getInitials(user.name)}</span>
          )}
          {/* Online dot */}
          <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full bg-emerald-500 border border-surface" />
        </div>
      ))}
      {overflow > 0 && (
        <div className="relative size-6 rounded-full border-2 border-surface bg-foreground/10 flex items-center justify-center">
          <span className="text-[9px] font-medium text-foreground/60">+{overflow}</span>
        </div>
      )}
    </div>
  );
}
