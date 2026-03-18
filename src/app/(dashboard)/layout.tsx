'use client';

import { useState, useCallback, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { ChevronLeft } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/layout/Header';
import { KiyokoChat } from '@/components/chat/KiyokoChat';
import { CommandMenu } from '@/components/shared/CommandMenu';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import { ProjectSidebarContent } from '@/components/layout/ProjectSidebar';
import { useKiyokoChat } from '@/hooks/useKiyokoChat';
import { cn } from '@/lib/utils/cn';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatWidth, setChatWidth] = useState(560);
  const chatWidthRef = useRef(560);
  const { isExpanded, toggleExpanded, setExpanded } = useKiyokoChat();

  const handleToggleChat = useCallback(() => {
    if (isExpanded) {
      setExpanded(false);
    }
    setChatOpen((p) => !p);
  }, [isExpanded, setExpanded]);

  const handleCloseChat = useCallback(() => {
    setChatOpen(false);
    setExpanded(false);
  }, [setExpanded]);

  const handleToggleExpand = useCallback(() => {
    toggleExpanded();
  }, [toggleExpanded]);

  const projectMatch = pathname.match(/^\/project\/([^/]+)/);
  const projectSlug = projectMatch ? projectMatch[1] : null;

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        {projectSlug ? (
          <ProjectSidebarContent projectSlug={projectSlug} />
        ) : (
          <DashboardSidebar />
        )}
      </Sidebar>

      <SidebarInset className="h-svh! max-h-svh! overflow-hidden">
        {/* Header — fixed at top */}
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-3 bg-background z-30">
          {pathname === '/dashboard' ? (
            <SidebarTrigger />
          ) : (
            <Button variant="ghost" size="icon" className="size-7" onClick={() => router.back()}>
              <ChevronLeft />
              <span className="sr-only">Volver</span>
            </Button>
          )}
          <Separator orientation="vertical" className="h-4" />
          <div className="flex-1 min-w-0">
            <Header onToggleChat={handleToggleChat} chatOpen={chatOpen} />
          </div>
        </header>

        {/* Content + Chat — fills remaining height below header */}
        <div className="flex flex-1 min-h-0 overflow-hidden">
          {/* Main content — hidden when chat is expanded */}
          {!(chatOpen && isExpanded) && (
            <div className="flex-1 overflow-y-auto min-w-0">{children}</div>
          )}

          {/* Chat */}
          {chatOpen && (
            <>
              {isExpanded ? (
                /* Expanded mode: chat fills entire content area */
                <div className="flex-1 min-w-0 min-h-0">
                  <KiyokoChat
                    mode="expanded"
                    onClose={handleCloseChat}
                    onToggleExpand={handleToggleExpand}
                    projectSlug={projectSlug ?? undefined}
                  />
                </div>
              ) : (
                /* Panel mode: resize handle + fixed-width panel */
                <>
                  {/* Resize handle */}
                  <div
                    className={cn(
                      'w-1.5 shrink-0 cursor-col-resize transition-colors',
                      'bg-transparent hover:bg-primary/30 active:bg-primary/50',
                      'relative group',
                    )}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      const startX = e.clientX;
                      const startW = chatWidthRef.current;
                      const onMove = (ev: MouseEvent) => {
                        const newW = Math.max(400, Math.min(1200, startW + (startX - ev.clientX)));
                        setChatWidth(newW);
                        chatWidthRef.current = newW;
                      };
                      const onUp = () => {
                        document.removeEventListener('mousemove', onMove);
                        document.removeEventListener('mouseup', onUp);
                        document.body.style.cursor = '';
                        document.body.style.userSelect = '';
                      };
                      document.addEventListener('mousemove', onMove);
                      document.addEventListener('mouseup', onUp);
                      document.body.style.cursor = 'col-resize';
                      document.body.style.userSelect = 'none';
                    }}
                  >
                    {/* Visual indicator line */}
                    <div className="absolute inset-y-0 left-1/2 -translate-x-1/2 w-px bg-border group-hover:bg-primary/50 transition-colors" />
                  </div>

                  {/* Chat panel */}
                  <div
                    className="shrink-0 min-h-0 border-l border-border"
                    style={{ width: chatWidth }}
                  >
                    <KiyokoChat
                      mode="panel"
                      onClose={handleCloseChat}
                      onToggleExpand={handleToggleExpand}
                      projectSlug={projectSlug ?? undefined}
                    />
                  </div>
                </>
              )}
            </>
          )}
        </div>
      </SidebarInset>

      <CommandMenu />
    </SidebarProvider>
  );
}
