'use client';

import { Search } from 'lucide-react';
import { SidebarGroup, SidebarGroupContent, useSidebar } from '@/components/ui/sidebar';

export function SidebarSearch() {
  const { state } = useSidebar();

  const openCommandMenu = () => {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true })
    );
  };

  if (state === 'collapsed') {
    return (
      <SidebarGroup className="px-2 py-1">
        <button
          onClick={openCommandMenu}
          className="h-8 w-8 rounded-md hover:bg-sidebar-accent flex items-center justify-center text-muted-foreground"
        >
          <Search className="h-4 w-4" />
        </button>
      </SidebarGroup>
    );
  }

  return (
    <SidebarGroup className="px-3 py-1">
      <SidebarGroupContent>
        <button
          onClick={openCommandMenu}
          className="flex w-full items-center gap-2 rounded-lg border border-sidebar-border bg-sidebar-accent/50 px-3 py-1.5 text-sm text-muted-foreground hover:bg-sidebar-accent transition-colors"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="flex-1 text-left text-xs">Buscar...</span>
          <kbd className="pointer-events-none text-[10px] text-muted-foreground/50 font-mono">Ctrl+K</kbd>
        </button>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
