'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Film, Palette, Users, Mountain,
  Paintbrush, FileText, Smartphone, CheckSquare,
  Activity, Settings, Bot, UserPlus,
  ChevronRight, ChevronLeft,
} from 'lucide-react';
import {
  SidebarGroup, SidebarGroupLabel, SidebarGroupContent,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton,
  SidebarMenuSub, SidebarMenuSubItem, SidebarMenuSubButton,
} from '@/components/ui/sidebar';
import {
  Collapsible, CollapsibleContent, CollapsibleTrigger,
} from '@/components/ui/collapsible';
interface Props {
  projectShortId: string;
}

export function SidebarProjectNav({ projectShortId }: Props) {
  const pathname = usePathname();
  const base = `/project/${projectShortId}`;

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Back to Dashboard */}
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href="/dashboard" />} className="text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
                <span>Dashboard</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Proyecto</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={base} />} isActive={pathname === base}>
                <LayoutDashboard className="h-4 w-4" />
                <span>Vista general</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/videos`} />} isActive={isActive(`${base}/videos`)}>
                <Film className="h-4 w-4" />
                <span>Videos</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            {/* Recursos — Expandible */}
            <Collapsible defaultOpen={isActive(`${base}/resources`)} className="group/collapsible">
              <SidebarMenuItem>
                <CollapsibleTrigger
                  render={
                    <SidebarMenuButton isActive={isActive(`${base}/resources`)}>
                      <Palette className="h-4 w-4" />
                      <span>Recursos</span>
                      <ChevronRight className="ml-auto h-3 w-3 transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </SidebarMenuButton>
                  }
                />
                <CollapsibleContent>
                  <SidebarMenuSub>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href={`${base}/resources/characters`} />}
                        isActive={isActive(`${base}/resources/characters`)}
                      >
                        <Users className="h-3 w-3" />
                        <span>Personajes</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href={`${base}/resources/backgrounds`} />}
                        isActive={isActive(`${base}/resources/backgrounds`)}
                      >
                        <Mountain className="h-3 w-3" />
                        <span>Fondos</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href={`${base}/resources/styles`} />}
                        isActive={isActive(`${base}/resources/styles`)}
                      >
                        <Paintbrush className="h-3 w-3" />
                        <span>Estilos</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        render={<Link href={`${base}/resources/templates`} />}
                        isActive={isActive(`${base}/resources/templates`)}
                      >
                        <FileText className="h-3 w-3" />
                        <span>Templates</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </CollapsibleContent>
              </SidebarMenuItem>
            </Collapsible>

            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/publications`} />} isActive={isActive(`${base}/publications`)}>
                <Smartphone className="h-4 w-4" />
                <span>Publicaciones</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/tasks`} />} isActive={isActive(`${base}/tasks`)}>
                <CheckSquare className="h-4 w-4" />
                <span>Tareas</span>
              </SidebarMenuButton>
            </SidebarMenuItem>

            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/activity`} />} isActive={isActive(`${base}/activity`)}>
                <Activity className="h-4 w-4" />
                <span>Actividad</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

      <SidebarGroup>
        <SidebarGroupLabel>Ajustes</SidebarGroupLabel>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/settings`} />} isActive={pathname === `${base}/settings`}>
                <Settings className="h-4 w-4" />
                <span>General</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/settings/ai`} />} isActive={isActive(`${base}/settings/ai`)}>
                <Bot className="h-4 w-4" />
                <span>IA y Agente</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
            <SidebarMenuItem>
              <SidebarMenuButton render={<Link href={`${base}/settings/sharing`} />} isActive={isActive(`${base}/settings/sharing`)}>
                <UserPlus className="h-4 w-4" />
                <span>Colaboradores</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>

    </>
  );
}
