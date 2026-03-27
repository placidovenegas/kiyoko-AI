'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { Settings, ChevronsRight } from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { useUIStore } from '@/stores/useUIStore';
import { SidebarHeaderSection } from './sidebar/SidebarHeader';
import { SidebarNavFixed } from './sidebar/SidebarNavFixed';
import { SidebarNavMain } from './sidebar/SidebarNavMain';
import { SidebarProjects } from './sidebar/SidebarProjects';
import { SidebarFavorites } from './sidebar/SidebarFavorites';
import { SidebarProjectNav } from './sidebar/SidebarProjectNav';
import { SidebarVideoNav } from './sidebar/SidebarVideoNav';
import { SidebarAdmin } from './sidebar/SidebarAdmin';
import { useSidebarContext } from './sidebar/SidebarContext';
import { cn } from '@/lib/utils/cn';

function SidebarDivider() {
  return <div className="my-1 mx-3 h-px bg-sidebar-border" />;
}

function SidebarSettingsButton() {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const btn = (
    <button
      type="button"
      onClick={() => openSettingsModal('perfil')}
      className={cn(
        'flex items-center rounded-md transition-colors cursor-pointer',
        'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        isCollapsed ? 'justify-center size-8' : 'w-full gap-2.5 px-2 h-8 text-[13px]',
      )}
    >
      <Settings className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
      {!isCollapsed && <span>Ajustes</span>}
    </button>
  );

  return (
    <div className={isCollapsed ? 'px-2 py-1' : 'px-1.5 py-1'}>
      {isCollapsed ? (
        <Tooltip>
          <Tooltip.Trigger>{btn}</Tooltip.Trigger>
          <Tooltip.Content placement="right">Ajustes</Tooltip.Content>
        </Tooltip>
      ) : btn}
    </div>
  );
}

function SidebarExpandButton() {
  const { state, toggleSidebar } = useSidebar();
  if (state === 'expanded') return null;

  return (
    <div className="px-2 py-1">
      <Tooltip>
        <Tooltip.Trigger>
          <button
            type="button"
            onClick={toggleSidebar}
            className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer"
          >
            <ChevronsRight className="h-4 w-4" />
          </button>
        </Tooltip.Trigger>
        <Tooltip.Content placement="right">Abrir menú</Tooltip.Content>
      </Tooltip>
    </div>
  );
}

export function AppSidebar() {
  const { level, projectShortId, videoShortId } = useSidebarContext();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-11.75 justify-center border-b border-sidebar-border">
        <SidebarHeaderSection />
      </SidebarHeader>

      <SidebarContent>
        <SidebarNavFixed />
        <SidebarNavMain />

        {level === 'dashboard' && (
          <>
            <SidebarDivider />
            <SidebarFavorites />
            <SidebarProjects />
            <SidebarDivider />
            <SidebarAdmin />
          </>
        )}

        {level === 'project' && (
          <SidebarProjectNav projectShortId={projectShortId!} />
        )}

        {level === 'video' && (
          <SidebarVideoNav
            projectShortId={projectShortId!}
            videoShortId={videoShortId!}
          />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border">
        <SidebarSettingsButton />
        <SidebarExpandButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
