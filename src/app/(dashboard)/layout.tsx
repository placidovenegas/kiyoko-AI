'use client';

import { useCallback } from 'react';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SearchModal } from '@/components/layout/SearchModal';
import { KiyokoPanel } from '@/components/kiyoko/KiyokoPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAIStore } from '@/stores/ai-store';
import { WorkspaceCreateModal } from '@/components/workspace/WorkspaceCreateModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { CookieBanner } from '@/components/shared/CookieBanner';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  const { isOpen, mode, toggleChat } = useAIStore();

  const handleToggleChat = useCallback(() => {
    toggleChat();
  }, [toggleChat]);

  // In fullscreen mode the chat replaces content; otherwise content is visible
  const showContent = !isOpen || mode !== 'fullscreen';

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="h-svh! max-h-svh! overflow-hidden">
        {/* Header */}
        <header className="flex h-11.75 shrink-0 items-center gap-2 border-b border-border px-3 bg-card z-30">
          <SidebarTrigger className="shrink-0" />
          <Separator orientation="vertical" className="h-4 shrink-0" />
          <div className="flex-1 min-w-0">
            <Header onToggleChat={handleToggleChat} chatOpen={isOpen} />
          </div>
        </header>

        {/* Content area */}
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {/* Main content */}
          {showContent && (
            <div className="flex flex-col flex-1 min-w-0 min-h-0">
              <div className="flex-1 overflow-y-auto min-w-0">
                {children}
              </div>
            </div>
          )}

          {/* Kiyoko panel — handles sidebar/floating/fullscreen internally */}
          <KiyokoPanel />
        </div>
      </SidebarInset>

      <SearchModal />
      <WorkspaceCreateModal />
      <SettingsModal />
      <CookieBanner />
    </SidebarProvider>
  );
}
