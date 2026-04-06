'use client';

import { usePathname } from 'next/navigation';
import { Share2, Calendar } from 'lucide-react';
import { useSidebar } from '@/components/ui/sidebar';
import { NavItem } from './shared/NavItem';

export function SidebarNavMain() {
  const pathname = usePathname();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <div className={isCollapsed ? 'px-2 pb-1' : 'px-1.5 pb-1'}>
      <ul className="flex flex-col gap-0.5">
        <NavItem href="/dashboard/shared" icon={Share2} label="Compartidos" pathname={pathname} isCollapsed={isCollapsed} />
        <NavItem href="/dashboard/publications" icon={Calendar} label="Publicaciones" pathname={pathname} isCollapsed={isCollapsed} />
      </ul>
    </div>
  );
}
