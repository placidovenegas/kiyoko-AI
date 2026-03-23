'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Video, Film, Clock, Mic, BarChart3, Share2, FileOutput,
  MessageSquareText, ArrowLeft, ChevronsUpDown, Check, LayoutDashboard,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import { useVideo } from '@/contexts/VideoContext';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { SidebarOrgHeader } from './SidebarOrgHeader';
import { SidebarUserFooter } from './SidebarUserFooter';
import type { Video as VideoType } from '@/types';

interface VideoListItem {
  id: string;
  title: string;
  short_id: string;
  platform: string;
  target_duration_seconds: number;
}

const VIDEO_TABS = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Escenas', href: '/scenes', icon: Film },
  { label: 'Timeline', href: '/timeline', icon: Clock },
  { label: 'Narración', href: '/narration', icon: Mic },
  { label: 'Análisis', href: '/analysis', icon: BarChart3 },
  { label: 'Compartir', href: '/share', icon: Share2 },
  { label: 'Exportar', href: '/export', icon: FileOutput },
] as const;

interface VideoSidebarContentProps {
  projectSlug: string;
  videoSlug: string;
  onOpenChat?: () => void;
}

export function VideoSidebarContent({ projectSlug, videoSlug, onOpenChat }: VideoSidebarContentProps) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/project/${projectSlug}`;
  const videoBasePath = `${basePath}/video/${videoSlug}`;
  const { project } = useProject();

  let video: VideoType | null = null;
  try {
    const ctx = useVideo();
    video = ctx.video;
  } catch {
    // Not inside VideoProvider
  }

  const [allVideos, setAllVideos] = useState<VideoListItem[]>([]);
  useEffect(() => {
    if (!project?.id) return;
    const supabase = createClient();
    supabase
      .from('videos')
      .select('id, title, short_id, platform, target_duration_seconds')
      .eq('project_id', project.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setAllVideos(data as VideoListItem[]);
      });
  }, [project?.id]);

  function getCurrentVideoSubPage(): string {
    return pathname.split(`/video/${videoSlug}`)[1] || '';
  }

  function handleSwitchVideo(targetSlug: string) {
    const subPage = getCurrentVideoSubPage();
    router.push(`${basePath}/video/${targetSlug}${subPage}`);
  }

  function isActive(tabHref: string) {
    if (tabHref === '') return pathname === videoBasePath;
    return pathname.startsWith(`${videoBasePath}${tabHref}`);
  }

  return (
    <>
      <SidebarOrgHeader />

      <SidebarContent>
        {/* ← Proyecto */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Volver al proyecto" render={<Link href={basePath} />}>
                <ArrowLeft className="h-4 w-4" />
                <span>Proyecto</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* VÍDEO — selector dropdown */}
        <SidebarGroup>
          <SidebarGroupLabel>Vídeo</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-sidebar-accent/50"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15 text-primary">
                      <Video className="h-3.5 w-3.5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-sidebar-foreground">
                        {video?.title ?? 'Video'}
                      </p>
                    </div>
                    <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/30" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" side="right" className="w-56">
                  {allVideos.map((v) => (
                    <DropdownMenuItem
                      key={v.id}
                      onClick={() => handleSwitchVideo(v.short_id)}
                      className="justify-between"
                    >
                      <div className="min-w-0">
                        <span className="block truncate">{v.title}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {v.platform} · {v.target_duration_seconds}s
                        </span>
                      </div>
                      {v.short_id === videoSlug && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={`${basePath}/videos`}>Todos los videos</Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        {/* Video tabs */}
        <SidebarGroup>
          <SidebarMenu>
            {VIDEO_TABS.map((tab) => (
              <SidebarMenuItem key={tab.href}>
                <SidebarMenuButton
                  isActive={isActive(tab.href)}
                  tooltip={tab.label}
                  render={<Link href={`${videoBasePath}${tab.href}`} />}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* Chat IA */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Chat IA" onClick={onOpenChat}>
                <MessageSquareText className="h-4 w-4" />
                <span>Chat IA</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>

      <SidebarUserFooter />
    </>
  );
}
