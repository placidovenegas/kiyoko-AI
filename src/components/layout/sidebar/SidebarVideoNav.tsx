'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Clapperboard, GanttChart, Mic, BarChart3,
  Share2, Download, ChevronDown, ChevronLeft, Film,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { queryKeys } from '@/lib/query/keys';
import {
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils/cn';

const SCENE_STATUS_COLORS: Record<string, string> = {
  draft: 'bg-zinc-400',
  prompt_ready: 'bg-blue-400',
  generating: 'bg-amber-400',
  generated: 'bg-emerald-400',
  approved: 'bg-emerald-600',
  rejected: 'bg-red-400',
};
interface Props {
  projectShortId: string;
  videoShortId: string;
}

export function SidebarVideoNav({ projectShortId, videoShortId }: Props) {
  const pathname = usePathname();
  const supabase = createClient();
  const base = `/project/${projectShortId}/video/${videoShortId}`;

  const { data: currentVideo } = useQuery({
    queryKey: ['video-meta', videoShortId],
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, title, platform, project_id')
        .eq('short_id', videoShortId)
        .single();
      return data;
    },
  });

  const { data: allVideos } = useQuery({
    queryKey: queryKeys.videos.byProject(currentVideo?.project_id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('videos')
        .select('id, short_id, title, platform')
        .eq('project_id', currentVideo!.project_id)
        .order('sort_order');
      return data ?? [];
    },
    enabled: !!currentVideo?.project_id,
  });

  const { data: scenes } = useQuery({
    queryKey: queryKeys.scenes.byVideo(currentVideo?.id ?? ''),
    queryFn: async () => {
      const { data } = await supabase
        .from('scenes')
        .select('id, short_id, scene_number, title, status')
        .eq('video_id', currentVideo!.id)
        .order('scene_number');
      return data ?? [];
    },
    enabled: !!currentVideo?.id,
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navItems = [
    { title: 'Vista general', icon: LayoutDashboard, href: base },
    { title: 'Escenas', icon: Clapperboard, href: `${base}/scenes` },
    { title: 'Timeline', icon: GanttChart, href: `${base}/timeline` },
    { title: 'Narracion', icon: Mic, href: `${base}/narration` },
    { title: 'Analisis', icon: BarChart3, href: `${base}/analysis` },
    { title: 'Compartir', icon: Share2, href: `${base}/share` },
    { title: 'Exportar', icon: Download, href: `${base}/export` },
  ];

  return (
    <>
      {/* Back to Project */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                render={<Link href={`/project/${projectShortId}`} />}
                className="text-muted-foreground"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Proyecto</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Video</SidebarGroupLabel>
        <SidebarGroupContent>
          <div className="px-2 pb-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="bordered" className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors">
                  <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">
                    {currentVideo?.title ?? 'Cargando...'}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-[--radix-dropdown-menu-trigger-width]">
                {allVideos?.map((v) => (
                  <DropdownMenuItem key={v.id} asChild>
                    <Link href={`/project/${projectShortId}/video/${v.short_id}`}>
                      <Film className="mr-2 h-4 w-4" />
                      {v.title}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <SidebarMenu>
            {navItems.map((item) => (
              <SidebarMenuItem key={item.href}>
                <SidebarMenuButton
                  render={<Link href={item.href} />}
                  isActive={item.href === base ? pathname === base : isActive(item.href)}
                >
                  <item.icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      {/* Scenes list */}
      {scenes && scenes.length > 0 && (
        <SidebarGroup>
          <SidebarGroupLabel>{`Escenas (${scenes.length})`}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {scenes.map((scene) => {
                const sceneHref = `${base}/scenes/${scene.short_id}`;
                const dotColor = SCENE_STATUS_COLORS[scene.status ?? 'draft'] ?? 'bg-zinc-400';
                return (
                  <SidebarMenuItem key={scene.id}>
                    <SidebarMenuButton
                      render={<Link href={sceneHref} />}
                      isActive={isActive(sceneHref)}
                      className="gap-2"
                    >
                      <span className={cn('w-2 h-2 rounded-full shrink-0', dotColor)} />
                      <span className="font-mono text-[11px] text-muted-foreground shrink-0">
                        {String(scene.scene_number).padStart(2, '0')}
                      </span>
                      <span className="truncate">{scene.title ?? 'Sin titulo'}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      )}

    </>
  );
}
