'use client';

import { useState, useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star, LayoutDashboard, Film, Video, Briefcase, CheckSquare,
  FileOutput, Settings, MessageSquareText, ScrollText, Mic,
  ChevronsUpDown, Check,
} from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useProject } from '@/contexts/ProjectContext';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useFavorites } from '@/hooks/useFavorites';
import { SidebarOrgHeader } from './SidebarOrgHeader';
import { SidebarUserFooter } from './SidebarUserFooter';
import { useVideo, type VideoCut } from '@/contexts/VideoContext';

interface VideoListItem {
  id: string;
  name: string;
  slug: string;
  platform: string;
  target_duration_seconds: number;
}

const PROJECT_TABS = [
  { label: 'Overview', href: '', icon: LayoutDashboard },
  { label: 'Videos', href: '/videos', icon: Video },
  { label: 'Recursos', href: '/resources', icon: Briefcase },
  { label: 'Tareas', href: '/tasks', icon: CheckSquare },
  { label: 'Ajustes', href: '/settings', icon: Settings },
] as const;

const VIDEO_TABS = [
  { label: 'Overview', href: '', icon: Video },
  { label: 'Storyboard', href: '/storyboard', icon: Film },
  { label: 'Guion', href: '/script', icon: ScrollText },
  { label: 'Narración', href: '/narration', icon: Mic },
  { label: 'Exportar', href: '/export', icon: FileOutput },
] as const;

export function ProjectSidebarContent({ projectSlug, onOpenChat }: { projectSlug: string; onOpenChat?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const basePath = `/project/${projectSlug}`;
  const { favorites, toggleFavorite } = useFavorites();
  const { project } = useProject();

  // Detect if we're inside a video route
  const videoMatch = pathname.match(/\/project\/[^/]+\/video\/([^/]+)/);
  const isInVideo = !!videoMatch;
  const currentVideoSlug = videoMatch?.[1] ?? null;

  // Get video context (only inside video routes)
  let video: VideoCut | null = null;
  try {
    const ctx = useVideo();
    video = ctx.video;
  } catch {
    // Not inside VideoProvider
  }

  // Load all videos for the switcher dropdown
  const [allVideos, setAllVideos] = useState<VideoListItem[]>([]);
  useEffect(() => {
    if (!project?.id) return;
    const supabase = createClient();
    supabase
      .from('video_cuts')
      .select('id, name, slug, platform, target_duration_seconds')
      .eq('project_id', project.id)
      .order('sort_order')
      .then(({ data }) => {
        if (data) setAllVideos(data as VideoListItem[]);
      });
  }, [project?.id]);

  function isActiveProject(tabHref: string) {
    if (tabHref === '') return pathname === basePath;
    return pathname.startsWith(`${basePath}${tabHref}`) && !pathname.includes('/video/');
  }

  function isActiveVideo(tabHref: string) {
    if (!videoMatch) return false;
    const videoBase = `${basePath}/video/${videoMatch[1]}`;
    if (tabHref === '') return pathname === videoBase;
    return pathname.startsWith(`${videoBase}${tabHref}`);
  }

  // Get current sub-page within video (storyboard, script, etc.)
  function getCurrentVideoSubPage(): string {
    if (!videoMatch) return '';
    const afterVideo = pathname.split(`/video/${videoMatch[1]}`)[1] || '';
    return afterVideo; // e.g. "/storyboard", "/script", ""
  }

  function handleSwitchVideo(targetSlug: string) {
    const subPage = getCurrentVideoSubPage();
    router.push(`${basePath}/video/${targetSlug}${subPage}`);
  }

  return (
    <>
      <SidebarOrgHeader />

      <SidebarContent>
        {isInVideo ? (
          <>
            {/* ── VIDEO LEVEL ── */}

            {/* Video switcher dropdown */}
            <SidebarGroup>
              <SidebarGroupLabel>Video</SidebarGroupLabel>
              <SidebarMenu>
                <SidebarMenuItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left transition hover:bg-sidebar-accent/50"
                      >
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-pink-500/15 text-pink-400">
                          <Video className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-semibold text-sidebar-foreground">
                            {video?.name ?? currentVideoSlug ?? 'Video'}
                          </p>
                          {video && (
                            <p className="truncate text-[10px] text-sidebar-foreground/40">
                              {video.platform} · {video.target_duration_seconds}s{video.aspect_ratio ? ` · ${video.aspect_ratio}` : ''}
                            </p>
                          )}
                        </div>
                        <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-sidebar-foreground/30" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" side="right" className="w-56">
                      {allVideos.map((v) => (
                        <DropdownMenuItem
                          key={v.id}
                          onClick={() => handleSwitchVideo(v.slug)}
                          className="justify-between"
                        >
                          <div className="min-w-0">
                            <span className="block truncate">{v.name}</span>
                            <span className="text-[10px] text-muted-foreground">
                              {v.platform} · {v.target_duration_seconds}s
                            </span>
                          </div>
                          {v.slug === currentVideoSlug && <Check className="h-4 w-4 shrink-0" />}
                        </DropdownMenuItem>
                      ))}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={`${basePath}/videos`}>
                          Todos los videos
                        </Link>
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
                      isActive={isActiveVideo(tab.href)}
                      tooltip={tab.label}
                      render={<Link href={`${basePath}/video/${currentVideoSlug}${tab.href}`} />}
                    >
                      <tab.icon className="h-4 w-4" /><span>{tab.label}</span>
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
                    <MessageSquareText className="h-4 w-4" /><span>Chat IA</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </>
        ) : (
          <>
            {/* ── PROJECT LEVEL ── */}
            <SidebarGroup>
              <SidebarGroupLabel>Proyecto</SidebarGroupLabel>
              <SidebarMenu>
                {PROJECT_TABS.map((tab) => (
                  <SidebarMenuItem key={tab.href}>
                    <SidebarMenuButton isActive={isActiveProject(tab.href)} tooltip={tab.label} render={<Link href={`${basePath}${tab.href}`} />}>
                      <tab.icon className="h-4 w-4" /><span>{tab.label}</span>
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
                    <MessageSquareText className="h-4 w-4" /><span>Chat IA</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* Favorites */}
            <SidebarGroup>
              <SidebarGroupLabel>Favoritos</SidebarGroupLabel>
              <SidebarMenu>
                {favorites.length === 0 && (
                  <div className="px-2 py-3 text-xs text-sidebar-foreground/30">
                    No hay favoritos
                  </div>
                )}
                {favorites.map((fav) => (
                  <SidebarMenuItem key={fav.id}>
                    <SidebarMenuButton
                      isActive={pathname.startsWith(`/project/${fav.slug}`)}
                      tooltip={fav.title}
                      render={<Link href={`/project/${fav.slug}`} />}
                    >
                      <span>{fav.title}</span>
                    </SidebarMenuButton>
                    <SidebarMenuAction
                      onClick={() => toggleFavorite(fav.id)}
                      title="Quitar de favoritos"
                    >
                      <Star className="size-4 text-amber-500 hover:text-amber-500/60" fill="currentColor" />
                    </SidebarMenuAction>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </>
        )}
      </SidebarContent>

      <SidebarUserFooter />
    </>
  );
}
