'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { createClient } from '@/lib/supabase/client';
import { useFavorites } from '@/hooks/useFavorites';
import { usePresence } from '@/hooks/usePresence';
import { FavoriteButton } from '@/components/shared/FavoriteButton';
import { PresenceIndicator } from '@/components/shared/PresenceIndicator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  IconLayoutDashboard,
  IconMovie,
  IconStethoscope,
  IconTimeline,
  IconUsers,
  IconPhoto,
  IconClock,
  IconBookmarks,
  IconMessageChatbot,
  IconFileExport,
  IconSettings,
  IconArrowLeft,
  IconChartLine,
} from '@tabler/icons-react';

const PROJECT_TABS = [
  { id: 'overview', label: 'Overview', href: '', icon: IconLayoutDashboard },
  { id: 'storyboard', label: 'Storyboard', href: '/storyboard', icon: IconMovie },
  { id: 'analysis', label: 'Diagnostico', href: '/analysis', icon: IconStethoscope },
  { id: 'arc', label: 'Arco Narrativo', href: '/arc', icon: IconChartLine },
  { id: 'scenes', label: 'Escenas', href: '/scenes', icon: IconTimeline },
  { id: 'characters', label: 'Personajes', href: '/characters', icon: IconUsers },
  { id: 'backgrounds', label: 'Fondos', href: '/backgrounds', icon: IconPhoto },
  { id: 'timeline', label: 'Timeline', href: '/timeline', icon: IconClock },
  { id: 'references', label: 'Referencias', href: '/references', icon: IconBookmarks },
  { id: 'chat', label: 'Chat IA', href: '/chat', icon: IconMessageChatbot },
  { id: 'exports', label: 'Exportar', href: '/exports', icon: IconFileExport },
] as const;

interface ProjectSidebarProps {
  projectSlug: string;
  collapsed: boolean;
}

interface ProjectData {
  id: string;
  title: string;
  client_name: string | null;
}

export function ProjectSidebar({ projectSlug, collapsed }: ProjectSidebarProps) {
  const pathname = usePathname();
  const basePath = `/project/${projectSlug}`;
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(true);
  const { isFavorite, toggleFavorite } = useFavorites();
  const { onlineUsers } = usePresence(project?.id);

  useEffect(() => {
    const supabase = createClient();
    supabase
      .from('projects')
      .select('id, title, client_name')
      .eq('slug', projectSlug)
      .single()
      .then(({ data }) => {
        if (data) setProject(data as ProjectData);
        setLoading(false);
      });
  }, [projectSlug]);

  function isActive(tabHref: string) {
    if (tabHref === '') return pathname === basePath;
    return pathname.startsWith(`${basePath}${tabHref}`);
  }

  return (
    <TooltipProvider delayDuration={0}>
      <nav className="py-2 px-1.5 space-y-0.5">
        {/* Back */}
        <NavItem
          href="/dashboard"
          label="Volver a Proyectos"
          icon={IconArrowLeft}
          collapsed={collapsed}
          active={false}
          muted
        />

        {/* Project name */}
        {!collapsed && (
          <div className="px-2.5 py-2">
            {loading ? (
              <div className="h-5 w-32 animate-pulse rounded bg-foreground/6" />
            ) : (
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold text-foreground truncate flex-1" title={project?.title}>
                  {project?.title ?? 'Proyecto'}
                </p>
                {project?.id && (
                  <FavoriteButton
                    isFavorite={isFavorite(project.id)}
                    onToggle={() => toggleFavorite(project.id)}
                    size={14}
                  />
                )}
              </div>
            )}
            {!loading && project?.client_name && (
              <p className="text-[11px] text-foreground/40 truncate mt-0.5">{project.client_name}</p>
            )}
            {!loading && onlineUsers.length > 0 && (
              <div className="mt-1.5"><PresenceIndicator users={onlineUsers} /></div>
            )}
          </div>
        )}

        <div className="my-1 mx-1.5 h-px bg-foreground/6" />

        {/* Tabs */}
        {PROJECT_TABS.map((tab) => (
          <NavItem
            key={tab.id}
            href={`${basePath}${tab.href}`}
            label={tab.label}
            icon={tab.icon}
            collapsed={collapsed}
            active={isActive(tab.href)}
          />
        ))}

        <div className="my-1 mx-1.5 h-px bg-foreground/6" />

        <NavItem
          href={`${basePath}/settings`}
          label="Ajustes"
          icon={IconSettings}
          collapsed={collapsed}
          active={pathname.startsWith(`${basePath}/settings`)}
        />
      </nav>
    </TooltipProvider>
  );
}

function NavItem({ href, label, icon: Icon, collapsed, active, muted }: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  collapsed: boolean;
  active: boolean;
  muted?: boolean;
}) {
  const link = (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2.5 rounded-md text-[13px] transition-colors duration-100',
        collapsed ? 'justify-center p-2' : 'px-2.5 py-1.75',
        active
          ? 'bg-brand-500/10 text-brand-500 font-medium'
          : muted
            ? 'text-foreground/40 hover:text-foreground hover:bg-foreground/5'
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
