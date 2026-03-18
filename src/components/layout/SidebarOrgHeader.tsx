'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export function SidebarOrgHeader() {
  const pathname = usePathname();
  const isProject = pathname.startsWith('/project/');
  const subtitle = isProject ? 'Proyecto' : 'Dashboard';

  return (
    <SidebarHeader>
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton size="lg" tooltip="Kiyoko AI" render={<Link href="/dashboard" />}>
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-xs font-bold">
              K
            </div>
            <div className="grid flex-1 text-left text-sm leading-tight">
              <span className="truncate font-semibold">Kiyoko AI</span>
              <span className="truncate text-xs text-sidebar-foreground/50">{subtitle}</span>
            </div>
          </SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarHeader>
  );
}
