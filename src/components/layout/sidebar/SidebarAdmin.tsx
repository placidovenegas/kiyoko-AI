'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BarChart3, Users } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils/cn';

const ITEMS = [
  { label: 'Panel admin', icon: BarChart3, href: '/admin' },
  { label: 'Usuarios', icon: Users, href: '/admin/users' },
];

export function SidebarAdmin() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase.from('profiles').select('role').eq('id', user.id).single().then(({ data }) => {
        if (data?.role === 'admin') setIsAdmin(true);
      });
    });
  }, []);

  if (!isAdmin) return null;

  return (
    <div className={isCollapsed ? 'px-2 py-1' : 'px-1.5 py-1'}>
      {!isCollapsed && (
        <div className="flex items-center px-2 h-7 mb-0.5">
          <span className="text-[11px] font-medium tracking-wide text-sidebar-foreground/50">Admin</span>
        </div>
      )}
      <ul className="flex flex-col gap-0.5">
        {ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const btn = (
            <Link
              href={item.href}
              className={cn(
                'flex items-center rounded-md transition-colors cursor-pointer',
                isActive
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                  : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                isCollapsed ? 'justify-center size-8' : 'w-full gap-2.5 px-2 h-8 text-[13px]',
              )}
            >
              <item.icon className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
              {!isCollapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );

          return (
            <li key={item.href}>
              {isCollapsed ? (
                <Tooltip>
                  <Tooltip.Trigger>{btn}</Tooltip.Trigger>
                  <Tooltip.Content placement="right">{item.label}</Tooltip.Content>
                </Tooltip>
              ) : btn}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
