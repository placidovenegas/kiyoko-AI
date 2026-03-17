'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { PanelLeft, Columns2, Sidebar as SidebarIcon, MousePointerClick, ChevronDown } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Header } from '@/components/layout/Header';
import { ChatPanel } from '@/components/layout/ChatPanel';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { cn } from '@/lib/utils/cn';

type SidebarMode = 'expanded' | 'collapsed' | 'hover';

const MODE_CONFIG = {
  expanded: { label: 'Expandido', icon: Columns2 },
  collapsed: { label: 'Colapsado', icon: SidebarIcon },
  hover: { label: 'Hover', icon: MousePointerClick },
} as const;

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>(() => {
    if (typeof window === 'undefined') return 'expanded';
    try {
      const stored = localStorage.getItem('kiyoko-layout');
      if (stored) return JSON.parse(stored).sidebarMode ?? 'expanded';
    } catch { /* */ }
    return 'expanded';
  });
  const [sidebarHovered, setSidebarHovered] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(380);
  const [modeOpen, setModeOpen] = useState(false);
  const modeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try { localStorage.setItem('kiyoko-layout', JSON.stringify({ sidebarMode, chatWidth })); } catch { /* */ }
  }, [sidebarMode, chatWidth]);

  useEffect(() => {
    function h(e: MouseEvent) { if (modeRef.current && !modeRef.current.contains(e.target as Node)) setModeOpen(false); }
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleToggleChat = useCallback(() => setChatOpen((p: boolean) => !p), []);
  const handleChatResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX; const startW = chatWidth;
    function onMove(ev: MouseEvent) { setChatWidth(Math.max(300, Math.min(600, startW + (startX - ev.clientX)))); }
    function onUp() { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); document.body.style.cursor = ''; document.body.style.userSelect = ''; }
    document.addEventListener('mousemove', onMove); document.addEventListener('mouseup', onUp);
    document.body.style.cursor = 'col-resize'; document.body.style.userSelect = 'none';
  }, [chatWidth]);

  // Sidebar dimensions — content NEVER shifts for hover mode
  const isCollapsed = sidebarMode === 'collapsed' || sidebarMode === 'hover';
  const sidebarStaticWidth = sidebarMode === 'expanded' ? 200 : 44;

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* ─── Navbar — same bg as sidebar for cohesion ─── */}
      <div className="flex items-center h-[50px] shrink-0 bg-background border-b border-foreground/[0.06] px-3">
        <div className="flex items-center gap-2 shrink-0 mr-3">
          <div className="flex items-center justify-center size-6 rounded-md bg-primary text-[10px] font-bold text-white">K</div>
          <span className="text-[12px] font-semibold text-foreground/60 hidden sm:inline">Kiyoko AI</span>
        </div>
        <div className="w-px h-4 bg-foreground/[0.06] mx-1.5 shrink-0" />
        <div className="flex-1 min-w-0">
          <Header onToggleChat={handleToggleChat} chatOpen={chatOpen} />
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar static space — always reserves width, never shifts main content */}
        <div
          className="shrink-0 transition-[width] duration-200 overflow-visible relative"
          style={{ width: sidebarStaticWidth }}
        >
          {/* Sidebar container — smooth hover animation */}
          <div
            className={cn(
              'h-full border-r border-foreground/[0.06] transition-[width] duration-300 ease-in-out',
              sidebarMode === 'hover' && !sidebarHovered && 'w-11 bg-background',
              sidebarMode === 'hover' && sidebarHovered && 'absolute left-0 top-0 bottom-0 z-40 w-50 bg-background shadow-2xl shadow-black/20',
              sidebarMode === 'expanded' && 'w-full bg-background',
              sidebarMode === 'collapsed' && 'w-full bg-background',
            )}
            onMouseEnter={() => { if (sidebarMode === 'hover') setSidebarHovered(true); }}
            onMouseLeave={() => { if (sidebarMode === 'hover') setSidebarHovered(false); setModeOpen(false); }}
          >
            <Sidebar
              collapsed={sidebarMode === 'collapsed' || (sidebarMode === 'hover' && !sidebarHovered)}
              onToggleCollapse={() => setSidebarMode(sidebarMode === 'expanded' ? 'collapsed' : 'expanded')}
              modeSelector={
                <div ref={modeRef} className="relative">
                  <button
                    type="button"
                    onClick={() => setModeOpen(p => !p)}
                    className={cn(
                      'flex items-center gap-2.5 w-full rounded-md text-[13px] transition-all duration-150',
                      isCollapsed && !sidebarHovered ? 'justify-center p-2' : 'px-2.5 py-1.5',
                      'text-foreground/40 hover:text-foreground/70 hover:bg-foreground/[0.04]',
                      modeOpen && 'bg-foreground/[0.08] text-foreground/70',
                    )}
                  >
                    <PanelLeft size={15} />
                    {!(isCollapsed && !sidebarHovered) && (
                      <>
                        <span className="flex-1 text-left text-[13px]">{MODE_CONFIG[sidebarMode].label}</span>
                        <ChevronDown size={11} className={cn('text-foreground/30 transition-transform duration-200', modeOpen && 'rotate-180')} />
                      </>
                    )}
                  </button>
                  {modeOpen && (
                    <div className={cn(
                      'absolute bottom-full mb-1.5 w-44 bg-background border border-foreground/[0.08] rounded-lg shadow-2xl py-1 z-[60]',
                      isCollapsed && !sidebarHovered ? 'left-full ml-1.5 bottom-0' : 'left-0',
                    )}>
                      {(Object.entries(MODE_CONFIG) as [SidebarMode, (typeof MODE_CONFIG)[SidebarMode]][]).map(([mode, config]) => {
                        const active = sidebarMode === mode;
                        return (
                          <button
                            key={mode}
                            onClick={() => { setSidebarMode(mode); setModeOpen(false); setSidebarHovered(false); }}
                            className={cn(
                              'flex items-center gap-2 w-full px-2.5 py-1.5 text-[11px] transition-colors',
                              active ? 'text-primary font-medium' : 'text-foreground/45 hover:text-foreground/70 hover:bg-foreground/5',
                            )}
                          >
                            <config.icon size={12} />
                            <span>{config.label}</span>
                            {active && <span className="ml-auto size-1.5 rounded-full bg-primary" />}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              }
            />
          </div>
        </div>

        {/* Main */}
        <main className="flex-1 overflow-y-auto">{children}</main>

        {/* Chat */}
        {chatOpen && (
          <>
            <div className="w-px cursor-col-resize bg-foreground/[0.04] hover:bg-primary/20 transition-colors shrink-0" onMouseDown={handleChatResize} />
            <div className="shrink-0 overflow-hidden" style={{ width: chatWidth }}>
              <ChatPanel onClose={() => setChatOpen(false)} />
            </div>
          </>
        )}
      </div>

      <CommandMenu />
    </div>
  );
}
