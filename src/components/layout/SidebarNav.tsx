'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  IconHome,
  IconPlus,
  IconUsers,
  IconSettings,
  IconKey,
} from '@tabler/icons-react';
import { cn } from '@/lib/utils/cn';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

interface SidebarNavProps {
  collapsed?: boolean;
  isAdmin?: boolean;
}

export function SidebarNav({ collapsed = false, isAdmin = false }: SidebarNavProps) {
  const pathname = usePathname();

  const sections: NavSection[] = [
    {
      items: [
        { label: 'Mis Proyectos', href: '/dashboard', icon: <IconHome className="size-5" /> },
        { label: 'Nuevo Proyecto', href: '/new', icon: <IconPlus className="size-5" /> },
      ],
    },
    ...(isAdmin
      ? [
          {
            title: 'ADMIN',
            items: [
              {
                label: 'Gestionar usuarios',
                href: '/admin/users',
                icon: <IconUsers className="size-5" />,
              },
            ],
          },
        ]
      : []),
    {
      title: 'CUENTA',
      items: [
        { label: 'Ajustes', href: '/settings', icon: <IconSettings className="size-5" /> },
        { label: 'Claves de IA', href: '/settings/api-keys', icon: <IconKey className="size-5" /> },
      ],
    },
  ];

  return (
    <div className="space-y-4">
      {sections.map((section, sIdx) => (
        <div key={sIdx}>
          {section.title && !collapsed && (
            <p className="px-5 mb-1 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
              {section.title}
            </p>
          )}

          <ul className="space-y-0.5 px-3">
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'));

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-2 py-2 rounded-md text-sm font-medium transition-colors',
                      collapsed && 'justify-center',
                      isActive
                        ? 'bg-primary/15 text-primary/90 dark:text-brand-400'
                        : 'text-muted-foreground hover:text-foreground hover:bg-secondary',
                    )}
                    title={collapsed ? item.label : undefined}
                  >
                    <span className="shrink-0">{item.icon}</span>
                    {!collapsed && <span>{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </div>
  );
}
