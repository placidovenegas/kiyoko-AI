'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { IconUser, IconSettings, IconKey, IconLogout } from '@tabler/icons-react';
import { cn } from '@/lib/utils/cn';

// Placeholder user data until auth is wired up
const PLACEHOLDER_USER = {
  name: 'Usuario Demo',
  email: 'demo@kiyoko.ai',
  initials: 'UD',
  avatarUrl: null as string | null,
};

interface MenuAction {
  label: string;
  href?: string;
  icon: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
}

export function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const user = PLACEHOLDER_USER;

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const actions: MenuAction[] = [
    { label: 'Perfil', href: '/settings/profile', icon: <IconUser className="size-4" /> },
    { label: 'Ajustes', href: '/settings', icon: <IconSettings className="size-4" /> },
    { label: 'Claves de IA', href: '/settings/api-keys', icon: <IconKey className="size-4" /> },
    {
      label: 'Cerrar sesión',
      icon: <IconLogout className="size-4" />,
      onClick: () => {
        // TODO: implement sign-out logic
        console.log('Sign out');
      },
      danger: true,
    },
  ];

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md',
          'hover:bg-surface-tertiary transition-colors',
        )}
        aria-label="Menú de usuario"
      >
        {/* Avatar */}
        {user.avatarUrl ? (
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="size-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center size-8 rounded-full bg-brand-500 text-white text-xs font-bold">
            {user.initials}
          </div>
        )}

        <span className="hidden sm:block text-sm font-medium text-foreground truncate max-w-[120px]">
          {user.name}
        </span>
      </button>

      {open && (
        <div
          className={cn(
            'absolute right-0 top-full mt-1 z-50 w-56',
            'bg-surface border border-foreground/10 rounded-lg shadow-card-hover',
            'py-1',
          )}
        >
          {/* User info header */}
          <div className="px-3 py-2 border-b border-foreground/10">
            <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
            <p className="text-xs text-foreground-muted truncate">{user.email}</p>
          </div>

          {/* Actions */}
          <div className="py-1">
            {actions.map((action) => {
              const className = cn(
                'flex items-center gap-2.5 w-full px-3 py-2 text-sm transition-colors text-left',
                action.danger
                  ? 'text-red-500 hover:bg-red-500/10'
                  : 'text-foreground-secondary hover:text-foreground hover:bg-surface-tertiary',
              );

              if (action.href) {
                return (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={className}
                    onClick={() => setOpen(false)}
                  >
                    {action.icon}
                    <span>{action.label}</span>
                  </Link>
                );
              }

              return (
                <button
                  key={action.label}
                  type="button"
                  className={className}
                  onClick={() => {
                    action.onClick?.();
                    setOpen(false);
                  }}
                >
                  {action.icon}
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
