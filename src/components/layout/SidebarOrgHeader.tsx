'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { KiyokoLogo } from '@/components/shared/KiyokoLogo';
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
            <KiyokoLogo variant="dark" size={28} />
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
