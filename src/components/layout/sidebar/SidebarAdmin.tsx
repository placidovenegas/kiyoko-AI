'use client';

import { usePathname } from 'next/navigation';
import { BarChart3, Users } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useSidebar } from '@/components/ui/sidebar';
import { NavItem, SectionLabel } from './shared/NavItem';

export function SidebarAdmin() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const { isAdmin } = useAuth();

  if (!isAdmin) return null;

  return (
    <div className={isCollapsed ? 'px-2 py-1' : 'px-1.5 py-1'}>
      {!isCollapsed && <SectionLabel>Admin</SectionLabel>}
      <ul className="flex flex-col gap-0.5">
        <NavItem href="/admin" icon={BarChart3} label="Panel admin" pathname={pathname} isCollapsed={isCollapsed} exact />
        <NavItem href="/admin/users" icon={Users} label="Usuarios" pathname={pathname} isCollapsed={isCollapsed} exact />
      </ul>
    </div>
  );
}
