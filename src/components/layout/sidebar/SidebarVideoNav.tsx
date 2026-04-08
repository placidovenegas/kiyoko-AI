'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { LayoutDashboard, Clapperboard, GanttChart, Mic, BarChart3, Share2, Download } from 'lucide-react';
import { Popover, Tooltip } from '@heroui/react';
import { createClient } from '@/lib/supabase/client';
import { useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils/cn';
import { NavItem, SectionLabel, Divider } from './shared/NavItem';

const SCENE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400', prompt_ready: 'bg-blue-400', generating: 'bg-amber-400',
  generated: 'bg-emerald-400', approved: 'bg-emerald-600', rejected: 'bg-red-400',
};

export function SidebarVideoNav({ projectShortId, videoShortId }: { projectShortId: string; videoShortId: string }) {
  const pathname = usePathname();
  const supabase = createClient();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';
  const base = `/project/${projectShortId}/video/${videoShortId}`;

  const { data: currentVideo } = useQuery({
    queryKey: ['video-meta', videoShortId],
    queryFn: async () => {
      const { data } = await supabase.from('videos').select('id, title, project_id').eq('short_id', videoShortId).single();
      return data;
    },
  });

  const { data: scenes } = useQuery({
    queryKey: ['scenes-nav', currentVideo?.id],
    queryFn: async () => {
      if (!currentVideo) return [];
      const { data } = await supabase.from('scenes').select('id, short_id, title, scene_number, status').eq('video_id', currentVideo.id).order('sort_order');
      return data ?? [];
    },
    enabled: !!currentVideo?.id,
  });

  if (isCollapsed) {
    return (
      <div className="flex flex-col">
        <div className="px-2 py-1">
          <ul className="flex flex-col gap-0.5">
            <NavItem href={base} icon={LayoutDashboard} label="Vista general" pathname={pathname} isCollapsed exact />
            <NavItem href={`${base}/timeline`} icon={GanttChart} label="Timeline" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/narration`} icon={Mic} label="Narración" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/analysis`} icon={BarChart3} label="Análisis" pathname={pathname} isCollapsed />
          </ul>
        </div>
        <Divider />
        <div className="px-2 py-1">
          <Popover>
            <Tooltip><Tooltip.Trigger>
              <Popover.Trigger><button type="button" className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"><Clapperboard className="h-4 w-4" /></button></Popover.Trigger>
            </Tooltip.Trigger><Tooltip.Content placement="right">Escenas</Tooltip.Content></Tooltip>
            <Popover.Content className="w-56 p-1">
              <p className="px-2 py-1 text-[11px] font-medium text-muted-foreground">Escenas</p>
              {scenes?.map((s) => (
                <Link key={s.id} href={`${base}/scene/${s.short_id}`} className={cn('flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors', pathname.startsWith(`${base}/scene/${s.short_id}`) ? 'bg-accent font-medium text-foreground' : 'text-foreground/80 hover:bg-accent')}>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', SCENE_STATUS_COLORS[s.status] ?? 'bg-zinc-400')} />
                  <span className="text-[10px] text-muted-foreground w-3 text-right shrink-0 tabular-nums">{s.scene_number}</span>
                  <span className="truncate">{s.title}</span>
                </Link>
              ))}
            </Popover.Content>
          </Popover>
        </div>
        <Divider />
        <div className="px-2 py-1">
          <ul className="flex flex-col gap-0.5">
            <NavItem href={`${base}/share`} icon={Share2} label="Compartir" pathname={pathname} isCollapsed />
            <NavItem href={`${base}/export`} icon={Download} label="Exportar" pathname={pathname} isCollapsed />
          </ul>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="px-1.5 py-1">
        <ul className="flex flex-col gap-0.5">
          <NavItem href={base} icon={LayoutDashboard} label="Vista general" pathname={pathname} isCollapsed={false} exact />
          <NavItem href={`${base}/timeline`} icon={GanttChart} label="Timeline" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/narration`} icon={Mic} label="Narración" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/analysis`} icon={BarChart3} label="Análisis" pathname={pathname} isCollapsed={false} />
        </ul>
      </div>

      <Divider />

      <div className="px-1.5 py-1">
        <SectionLabel>Escenas {scenes ? `(${scenes.length})` : ''}</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          {scenes?.map((s) => {
            const sceneHref = `${base}/scene/${s.short_id}`;
            const isActive = pathname.startsWith(sceneHref);
            return (
              <li key={s.id}>
                <Link href={sceneHref} className={cn(
                  'flex w-full items-center gap-2 rounded-md px-2 h-7 text-[12px] transition-colors',
                  isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                )}>
                  <span className={cn('h-1.5 w-1.5 rounded-full shrink-0', SCENE_STATUS_COLORS[s.status] ?? 'bg-zinc-400')} />
                  <span className="text-[10px] text-sidebar-foreground/40 w-3 text-right shrink-0 tabular-nums">{s.scene_number}</span>
                  <span className="truncate">{s.title}</span>
                </Link>
              </li>
            );
          })}
          {scenes && scenes.length === 0 && <li className="px-2 py-1 text-xs text-sidebar-foreground/40">Sin escenas</li>}
        </ul>
      </div>

      <Divider />

      <div className="px-1.5 py-1">
        <SectionLabel>Acciones</SectionLabel>
        <ul className="flex flex-col gap-0.5">
          <NavItem href={`${base}/share`} icon={Share2} label="Compartir" pathname={pathname} isCollapsed={false} />
          <NavItem href={`${base}/export`} icon={Download} label="Exportar" pathname={pathname} isCollapsed={false} />
        </ul>
      </div>
    </div>
  );
}
