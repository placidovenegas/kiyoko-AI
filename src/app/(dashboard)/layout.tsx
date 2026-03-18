'use client';

import { useState, useCallback, useEffect } from 'react';
import { PanelLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/cn';

type SidebarMode = 'expanded' | 'collapsed';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window === 'undefined') return 'expanded';
    try {
      const stored = localStorage.getItem('kiyoko-layout');
      if (stored) {
        const parsed = JSON.parse(stored).sidebarMode;
        if (parsed === 'expanded' || parsed === 'collapsed') return parsed;
      }
    } catch { /* */ }
    return 'expanded';
  });
  const [chatOpen, setChatOpen] = useState(false);

  const isCollapsed = sidebarMode === 'collapsed';
  const sidebarWidth = isCollapsed ? 48 : 220;

  useEffect(() => {
    try { localStorage.setItem('kiyoko-layout', JSON.stringify({ sidebarMode })); } catch { /* */ }
  }, [sidebarMode]);

  const toggleSidebar = useCallback(() => {
    setSidebarMode((m) => m === 'expanded' ? 'collapsed' : 'expanded');
  }, []);

  const handleToggleChat = useCallback(() => setChatOpen((p) => !p), []);

  return (
    <TooltipProvider delayDuration={0}>
      <div className="flex h-screen flex-col overflow-hidden bg-background">
        {/* ─── Navbar ─── */}
        <div className="flex items-center h-12 shrink-0 bg-background border-b border-foreground/6 px-3">
          <div className="flex items-center gap-2 shrink-0 mr-3">
            <div className="flex items-center justify-center size-6 rounded-md bg-primary text-[10px] font-bold text-white">K</div>
            {!isCollapsed && (
              <span className="text-[12px] font-semibold text-foreground/60 hidden sm:inline">Kiyoko AI</span>
            )}
          </div>
          <div className="w-px h-4 bg-foreground/6 mx-1 shrink-0" />
          <div className="flex-1 min-w-0">
            <Header onToggleChat={handleToggleChat} chatOpen={chatOpen} />
          </div>
        </div>

        {/* ─── Body ─── */}
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <div
            className="shrink-0 flex flex-col bg-background border-r border-foreground/6 overflow-hidden transition-[width] duration-200 ease-in-out"
            style={{ width: sidebarWidth }}
          >
            <div className="flex-1 overflow-y-auto overflow-x-hidden">
              <Sidebar collapsed={isCollapsed} onToggleCollapse={toggleSidebar} />
            </div>

            {/* Toggle button */}
            <div className="shrink-0 border-t border-foreground/6 p-1.5">
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={toggleSidebar}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-md text-[13px] transition-all duration-150',
                      isCollapsed ? 'justify-center p-2' : 'px-2.5 py-1.5',
                      'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/5',
                    )}
                  >
                    <PanelLeft size={15} className={cn('transition-transform', isCollapsed && 'rotate-180')} />
                    {!isCollapsed && <span className="flex-1 text-left">Colapsar</span>}
                  </button>
                </TooltipTrigger>
                {isCollapsed && (
                  <TooltipContent side="right" sideOffset={8}>
                    <p className="text-xs">Expandir menu</p>
                  </TooltipContent>
                )}
              </Tooltip>
            </div>
          </div>

          {/* Main + Chat with resizable panels */}
          {chatOpen ? (
            <ResizablePanelGroup orientation="horizontal" className="flex-1">
              <ResizablePanel defaultSize={70} minSize={40}>
                <main className="h-full overflow-y-auto">{children}</main>
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel defaultSize={30} minSize={20} maxSize={45}>
                <ChatPanel onClose={() => setChatOpen(false)} />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <main className="flex-1 overflow-y-auto">{children}</main>
          )}
        </div>

        <CommandMenu />
      </div>
    </TooltipProvider>
  );
}
