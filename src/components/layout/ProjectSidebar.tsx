'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Star } from 'lucide-react';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
} from '@/components/ui/sidebar';
import { useFavorites } from '@/hooks/useFavorites';
import { SidebarOrgHeader } from './SidebarOrgHeader';
import { SidebarUserFooter } from './SidebarUserFooter';
import {
  IconLayoutDashboard, IconMovie, IconStethoscope, IconTimeline,
  IconUsers, IconPhoto, IconClock, IconBookmarks,
  IconMessageChatbot, IconFileExport, IconSettings, IconChartLine,
} from '@tabler/icons-react';

const PROJECT_TABS = [
  { label: 'Overview', href: '', icon: IconLayoutDashboard },
  { label: 'Storyboard', href: '/storyboard', icon: IconMovie },
  { label: 'Diagnostico', href: '/analysis', icon: IconStethoscope },
  { label: 'Arco Narrativo', href: '/arc', icon: IconChartLine },
  { label: 'Escenas', href: '/scenes', icon: IconTimeline },
  { label: 'Personajes', href: '/characters', icon: IconUsers },
  { label: 'Fondos', href: '/backgrounds', icon: IconPhoto },
  { label: 'Timeline', href: '/timeline', icon: IconClock },
  { label: 'Referencias', href: '/references', icon: IconBookmarks },
  { label: 'Chat IA', href: '/chat', icon: IconMessageChatbot },
  { label: 'Exportar', href: '/exports', icon: IconFileExport },
] as const;

export function ProjectSidebarContent({ projectSlug }: { projectSlug: string }) {
  const pathname = usePathname();
  const basePath = `/project/${projectSlug}`;
  const { favorites, toggleFavorite } = useFavorites();

  function isActive(tabHref: string) {
    if (tabHref === '') return pathname === basePath;
    return pathname.startsWith(`${basePath}${tabHref}`);
  }

  return (
    <>
      <SidebarOrgHeader />

      <SidebarContent>
        {/* Project Tabs */}
        <SidebarGroup>
          <SidebarGroupLabel>Proyecto</SidebarGroupLabel>
          <SidebarMenu>
            {PROJECT_TABS.map((tab) => (
              <SidebarMenuItem key={tab.href}>
                <SidebarMenuButton isActive={isActive(tab.href)} tooltip={tab.label} render={<Link href={`${basePath}${tab.href}`} />}>
                  <tab.icon /><span>{tab.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
            <SidebarMenuItem>
              <SidebarMenuButton isActive={pathname.startsWith(`${basePath}/settings`)} tooltip="Ajustes" render={<Link href={`${basePath}/settings`} />}>
                <IconSettings /><span>Ajustes</span>
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
      </SidebarContent>

      <SidebarUserFooter />
    </>
  );
}
