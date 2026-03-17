'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, PlusCircle, Users, Settings, Key, FileText } from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  modeSelector?: React.ReactNode;
}

interface RecentProject { id: string; slug: string; title: string; }

export function Sidebar({ collapsed, modeSelector }: SidebarProps) {
  const pathname = usePathname();
  const supabase = createClient();
  const [recentProjects, setRecentProjects] = useState<RecentProject[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: p } = await supabase.from('profiles').select('role').eq('id', user.id).single();
      if (p?.role === 'admin') setIsAdmin(true);
      const { data: projects } = await supabase.from('projects').select('id, slug, title').order('updated_at', { ascending: false }).limit(4);
      if (projects) setRecentProjects(projects as RecentProject[]);
    }
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function NavLink({ href, label, icon: Icon }: { href: string; label: string; icon: React.ComponentType<{ size?: number; className?: string }> }) {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
    return (
      <Link
        href={href}
        title={collapsed ? label : undefined}
        className={cn(
          'flex items-center gap-2.5 rounded-md text-[13px] transition-colors duration-100',
          collapsed ? 'justify-center p-2' : 'px-2.5 py-[6px]',
          active ? 'bg-foreground/[0.08] text-foreground' : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04]',
        )}
      >
        <Icon size={15} className="shrink-0" />
        {!collapsed && <span className="truncate">{label}</span>}
      </Link>
    );
  }

  return (
    <aside className="flex flex-col h-full overflow-hidden">
      <nav className="flex-1 overflow-y-auto py-2 px-1.5 space-y-0.5">
        <NavLink href="/dashboard" label="Proyectos" icon={LayoutDashboard} />
        <NavLink href="/new" label="Nuevo" icon={PlusCircle} />

        <div className="!my-2 mx-1.5 h-px bg-foreground/[0.06]" />

        {recentProjects.map(project => {
          const active = pathname.startsWith(`/p/${project.slug}`);
          return (
            <Link
              key={project.id}
              href={`/p/${project.slug}`}
              title={collapsed ? project.title : undefined}
              className={cn(
                'flex items-center gap-2 rounded-md text-[13px] transition-colors duration-100',
                collapsed ? 'justify-center p-2' : 'px-2.5 py-[6px]',
                active ? 'bg-foreground/[0.08] text-foreground' : 'text-foreground/50 hover:text-foreground/80 hover:bg-foreground/[0.04]',
              )}
            >
              <FileText size={14} className="shrink-0" />
              {!collapsed && <span className="truncate">{project.title}</span>}
            </Link>
          );
        })}

        {isAdmin && <div className="!my-2 mx-1.5 h-px bg-foreground/[0.06]" />}
        {isAdmin && <NavLink href="/admin/users" label="Usuarios" icon={Users} />}

        <div className="!my-2 mx-1.5 h-px bg-foreground/[0.06]" />

        <NavLink href="/settings" label="Ajustes" icon={Settings} />
        <NavLink href="/settings/api-keys" label="API Keys" icon={Key} />
      </nav>

      {modeSelector && (
        <div className="shrink-0 border-t border-foreground/[0.06] p-1.5">
          {modeSelector}
        </div>
      )}
    </aside>
  );
}
