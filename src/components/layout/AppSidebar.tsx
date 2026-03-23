'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SidebarHeaderSection, SidebarExpandButton } from './sidebar/SidebarHeader';
import { SidebarNavFixed } from './sidebar/SidebarNavFixed';
import { SidebarNavMain } from './sidebar/SidebarNavMain';
import { SidebarProjects } from './sidebar/SidebarProjects';
import { SidebarFavorites } from './sidebar/SidebarFavorites';
import { SidebarProjectNav } from './sidebar/SidebarProjectNav';
import { SidebarVideoNav } from './sidebar/SidebarVideoNav';
import { SidebarAdmin } from './sidebar/SidebarAdmin';
import { useSidebarContext } from './sidebar/SidebarContext';

export function AppSidebar() {
  const { level, projectShortId, videoShortId } = useSidebarContext();

  return (
    <Sidebar collapsible="icon" className="border-r border-border">
      <SidebarHeader className="h-11.75 justify-center border-b border-sidebar-border">
        <SidebarHeaderSection />
      </SidebarHeader>

      <SidebarContent>
        {/* Fixed nav — always visible at all levels */}
        <SidebarNavFixed />

        {level === 'dashboard' && (
          <>
            <SidebarNavMain />
            <SidebarProjects />
            <SidebarFavorites />
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

      {/* Footer: only shows expand button when sidebar is collapsed */}
      <SidebarFooter>
        <SidebarExpandButton />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
