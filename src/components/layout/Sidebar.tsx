'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Users, Settings, Key } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { ProjectSidebar } from './ProjectSidebar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ collapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isAdmin, setIsAdmin] = useState(false);

  const projectMatch = pathname.match(/^\/project\/([^/]+)/);
  const projectSlug = projectMatch ? projectMatch[1] : null;

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (p?.role === 'admin') setIsAdmin(true);
    }
    load();
  }, []);

  if (projectSlug) {
    return <ProjectSidebar projectSlug={projectSlug} collapsed={collapsed} />;
  }

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="py-2 px-1.5 space-y-0.5">
        <NavItem href="/dashboard" label="Proyectos" icon={LayoutDashboard} collapsed={collapsed} active={pathname === '/dashboard'} />
        <NavItem href="/new" label="Nuevo Proyecto" icon={PlusCircle} collapsed={collapsed} active={pathname === '/new'} />
        <NavItem href="/organizations" label="Organizaciones" icon={Users} collapsed={collapsed} active={pathname.startsWith('/organizations')} />

        {isAdmin && (
          <>
            <div className="my-2 mx-1.5 h-px bg-foreground/6" />
            <NavItem href="/admin/users" label="Admin" icon={Users} collapsed={collapsed} active={pathname.startsWith('/admin')} />
          </>
        )}

        <div className="my-2 mx-1.5 h-px bg-foreground/6" />
        <NavItem href="/settings" label="Ajustes" icon={Settings} collapsed={collapsed} active={pathname === '/settings'} />
        <NavItem href="/settings/api-keys" label="API Keys" icon={Key} collapsed={collapsed} active={pathname === '/settings/api-keys'} />
      </nav>
    </TooltipProvider>
  );
}

function NavItem({ href, label, icon: Icon, collapsed, active }: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  collapsed: boolean;
  active: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-[13px] transition-colors duration-100',
        collapsed ? 'justify-center p-2' : 'px-2.5 py-1.75',
        active
          ? 'bg-brand-500/10 text-brand-500 font-medium'
          : 'text-foreground/50 hover:text-foreground hover:bg-foreground/5',
      )}
    >
      <Icon size={16} className="shrink-0" />
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>
          <p className="text-xs">{label}</p>
        </TooltipContent>
      </Tooltip>
    );
  }

  return link;
}
