'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  LayoutDashboard, Film, Clock, Mic, BarChart3,
  Share2, Download, ChevronDown, ChevronLeft,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { queryKeys } from '@/lib/query/keys';
import {
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
} from '@/components/ui/sidebar';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  const navItems = [
    { title: 'Overview', icon: LayoutDashboard, href: base },
    { title: 'Escenas', icon: Film, href: `${base}/scenes` },
    { title: 'Timeline', icon: Clock, href: `${base}/timeline` },
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
                <button className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/30 px-3 py-2 text-sm hover:bg-sidebar-accent transition-colors">
                  <Film className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 text-left truncate">
                    {currentVideo?.title ?? 'Cargando...'}
                  </span>
                  <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
                </button>
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

    </>
  );
}
