'use client';

import {
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, useSidebar,
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
import { Divider } from './sidebar/shared/NavItem';
import { cn } from '@/lib/utils/cn';

function SidebarFooterContent() {
  const openSettingsModal = useUIStore((s) => s.openSettingsModal);
  const { state, toggleSidebar } = useSidebar();
  const isCollapsed = state === 'collapsed';

  if (isCollapsed) {
    return (
      <div className="px-2 py-1.5 flex flex-col gap-0.5">
        <Tooltip>
          <Tooltip.Trigger>
            <button type="button" onClick={() => openSettingsModal('perfil')} className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer">
              <Settings className="h-4 w-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content placement="right">Ajustes</Tooltip.Content>
        </Tooltip>
        <Tooltip>
          <Tooltip.Trigger>
            <button type="button" onClick={toggleSidebar} className="flex items-center justify-center size-8 rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors cursor-pointer">
              <ChevronsRight className="h-4 w-4" />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content placement="right">Abrir menú</Tooltip.Content>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="px-1.5 py-1.5">
      <button
        type="button"
        onClick={() => openSettingsModal('perfil')}
        className={cn(
          'flex w-full items-center gap-2.5 rounded-md px-2 h-8 text-[13px] transition-colors cursor-pointer',
          'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
        )}
      >
        <Settings className="h-4 w-4 shrink-0 text-sidebar-foreground/60" />
        <span>Ajustes</span>
      </button>
    </div>
  );
}

// ── Main Sidebar ────────────────────────────────────────────────────────────

export function AppSidebar() {
  const { level, projectShortId, videoShortId } = useSidebarContext();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-11.75 justify-center border-b border-sidebar-border">
        <SidebarHeaderSection />
      </SidebarHeader>

      <SidebarContent>
        {/* ── Navegación (siempre visible) ── */}
        <SidebarNavFixed />
        <SidebarNavMain />

        <Divider />

        {/* ── Dashboard ── */}
        {level === 'dashboard' && (
          <>
            <SidebarFavorites />
            <SidebarProjects />
            <Divider />
            <SidebarAdmin />
          </>
        )}

        {/* ── Proyecto ── */}
        {level === 'project' && (
          <SidebarProjectNav projectShortId={projectShortId!} />
        )}

        {/* ── Video ── */}
        {level === 'video' && (
          <SidebarVideoNav projectShortId={projectShortId!} videoShortId={videoShortId!} />
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-0!">
        <SidebarFooterContent />
      </SidebarFooter>

    </Sidebar>
  );
}
