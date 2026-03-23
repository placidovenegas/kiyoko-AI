'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard, Video, Briefcase, CheckSquare,
  Settings, MessageSquareText, Activity, Megaphone,
  Users, Paintbrush, Image, LayoutTemplate,
  ChevronRight, ArrowLeft, Bot, Handshake,
} from 'lucide-react';
import { useProject } from '@/contexts/ProjectContext';
import {
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuAction,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { SidebarOrgHeader } from './SidebarOrgHeader';
import { SidebarUserFooter } from './SidebarUserFooter';

const RESOURCE_TABS = [
  { label: 'Todos', href: '/resources', icon: Briefcase },
  { label: 'Personajes', href: '/resources/characters', icon: Users },
  { label: 'Fondos', href: '/resources/backgrounds', icon: Image },
  { label: 'Estilos', href: '/resources/styles', icon: Paintbrush },
  { label: 'Templates', href: '/resources/templates', icon: LayoutTemplate },
] as const;

const SETTINGS_TABS = [
  { label: 'General', href: '/settings', icon: Settings },
  { label: 'IA y Agente', href: '/settings/ai', icon: Bot },
  { label: 'Colaboradores', href: '/settings/sharing', icon: Handshake },
] as const;

interface ProjectSidebarContentProps {
  projectSlug: string;
  onOpenChat?: () => void;
}

export function ProjectSidebarContent({ projectSlug, onOpenChat }: ProjectSidebarContentProps) {
  const pathname = usePathname();
  const basePath = `/project/${projectSlug}`;
  useProject();

  const [resourcesOpen, setResourcesOpen] = useState(
    pathname.startsWith(`${basePath}/resources`)
  );

  function isActive(tabHref: string) {
    const fullPath = `${basePath}${tabHref}`;
    if (tabHref === '') return pathname === basePath;
    return pathname === fullPath || pathname.startsWith(`${fullPath}/`);
  }

  return (
    <>
      <SidebarOrgHeader />

      <SidebarContent>
        {/* ← Dashboard */}
        <SidebarGroup>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton tooltip="Dashboard" render={<Link href="/dashboard" />}>
                <ArrowLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* PROYECTO */}
        <SidebarGroup>
          <SidebarGroupLabel>Proyecto</SidebarGroupLabel>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton isActive={isActive('')} tooltip="Vista general" render={<Link href={basePath} />}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Vista general</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={isActive('/videos')} tooltip="Vídeos" render={<Link href={`${basePath}/videos`} />}>
                <Video className="h-4 w-4" />
                <span>Vídeos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Recursos — collapsible */}
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={pathname.startsWith(`${basePath}/resources`)}
                tooltip="Recursos"
                onClick={() => setResourcesOpen((o) => !o)}
              >
                <Briefcase className="h-4 w-4" />
                <span>Recursos</span>
              </SidebarMenuButton>
              <SidebarMenuAction
                onClick={() => setResourcesOpen((o) => !o)}
                className={resourcesOpen ? 'rotate-90' : ''}
              >
                <ChevronRight className="h-4 w-4" />
              </SidebarMenuAction>
              {resourcesOpen && (
                <SidebarMenuSub>
                  {RESOURCE_TABS.map((tab) => (
                    <SidebarMenuSubItem key={tab.href}>
                      <SidebarMenuSubButton
                        render={<Link href={`${basePath}${tab.href}`} />}
                        isActive={tab.href === '/resources' ? pathname === `${basePath}/resources` : isActive(tab.href)}
                      >
                        <tab.icon className="h-3.5 w-3.5" />
                        <span>{tab.label}</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  ))}
                </SidebarMenuSub>
              )}
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={isActive('/publications')} tooltip="Publicaciones" render={<Link href={`${basePath}/publications`} />}>
                <Megaphone className="h-4 w-4" />
                <span>Publicaciones</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={isActive('/tasks')} tooltip="Tareas" render={<Link href={`${basePath}/tasks`} />}>
                <CheckSquare className="h-4 w-4" />
                <span>Tareas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton isActive={isActive('/activity')} tooltip="Actividad" render={<Link href={`${basePath}/activity`} />}>
                <Activity className="h-4 w-4" />
                <span>Actividad</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroup>

        <SidebarSeparator />

        {/* AJUSTES — collapsible */}
        <SidebarGroup>
          <SidebarGroupLabel>Ajustes</SidebarGroupLabel>
          <SidebarMenu>
            {SETTINGS_TABS.map((tab) => (
              <SidebarMenuItem key={tab.href}>
                <SidebarMenuButton
                  isActive={tab.href === '/settings' ? pathname === `${basePath}/settings` : isActive(tab.href)}
                  tooltip={tab.label}
                  render={<Link href={`${basePath}${tab.href}`} />}
                >
                  <tab.icon className="h-4 w-4" />
                  <span>{tab.label}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

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
