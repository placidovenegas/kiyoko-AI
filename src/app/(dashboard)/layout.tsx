'use client';

import { useCallback, useEffect, useMemo } from 'react';
import {
  SidebarProvider,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { SearchModal } from '@/components/layout/SearchModal';
import { KiyokoPanel } from '@/components/kiyoko/KiyokoPanel';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { useAIStore } from '@/stores/ai-store';
import { useUIStore } from '@/stores/useUIStore';
import { WorkspaceCreateModal } from '@/components/workspace/WorkspaceCreateModal';
import { SettingsModal } from '@/components/settings/SettingsModal';
import { ProjectCreatePanel } from '@/components/project/ProjectCreatePanel';
import { CookieBanner } from '@/components/shared/CookieBanner';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';


export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  useKeyboardShortcuts();

  const { isOpen, mode, toggleChat } = useAIStore();
  const { settingsModalOpen, openSettingsModal } = useUIStore();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggleChat = useCallback(() => {
    toggleChat();
  }, [toggleChat]);

  // In fullscreen mode the chat replaces content; otherwise content is visible
  const showContent = !isOpen || mode !== 'fullscreen';
  const isFullscreen = isOpen && mode === 'fullscreen';

  // ---- Abrir Settings modal desde URL directas (profesional y consistente) ----
  const desiredSettingsSection = useMemo(() => {
    const sectionFromQuery = searchParams.get('section') ?? undefined;
    if (sectionFromQuery) return sectionFromQuery;

    if (pathname.startsWith('/settings/api-keys')) return 'api-keys';
    if (pathname.startsWith('/settings/subscription')) return 'suscripcion';
    if (pathname.startsWith('/settings/notifications')) return 'notificaciones';
    if (pathname.startsWith('/settings')) return 'perfil';

    return 'perfil';
  }, [pathname, searchParams]);

  const shouldOpenFromQuery = searchParams.get('settings') === 'open';
  const shouldOpenFromPath = pathname.startsWith('/settings');

  useEffect(() => {
    const shouldOpen = shouldOpenFromQuery || shouldOpenFromPath;
    if (!shouldOpen) return;
    if (settingsModalOpen) return;
    openSettingsModal(desiredSettingsSection);
  }, [
    shouldOpenFromQuery,
    shouldOpenFromPath,
    settingsModalOpen,
    openSettingsModal,
    desiredSettingsSection,
  ]);

  // Limpieza: si el modal se abrió por query (?settings=open), al cerrarlo eliminamos el flag.
  useEffect(() => {
    if (settingsModalOpen) return;
    if (!shouldOpenFromQuery) return;
    if (pathname.startsWith('/settings')) return; // en /settings no tocamos la ruta

    const sp = new URLSearchParams(searchParams.toString());
    sp.delete('settings');
    sp.delete('section');
    const qs = sp.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [settingsModalOpen, shouldOpenFromQuery, pathname, searchParams, router]);

  // Nota: closeSettingsModal lo maneja el propio SettingsModal al cambiar open=false.
  // (Antes se usaba para compactar header; en V6 el navbar del chat se alinea fijo a 47px.)

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="h-svh! max-h-svh! overflow-hidden">
        <div className="flex flex-1 min-h-0 overflow-hidden relative">
          {isFullscreen ? (
            // Fullscreen: ocultamos navbar + página y dejamos solo el chat.
            <KiyokoPanel />
          ) : (
            <>
              {/* Left column: header + main content */}
              <div className="flex flex-col flex-1 min-h-0 min-w-0">
                {/* Header */}
                <header className="flex shrink-0 items-center gap-2 border-b border-border px-3 bg-card z-30 h-11.75">
                  <div className="flex-1 min-w-0">
                    <Header onToggleChat={handleToggleChat} chatOpen={isOpen} />
                  </div>
                </header>

                {/* Main content */}
                <div className="flex flex-1 min-h-0 overflow-hidden relative">
                  {showContent && (
                    <div className="flex flex-col flex-1 min-w-0 min-h-0">
                      <div className="flex-1 overflow-y-auto min-w-0 px-1">
                        {children}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Kiyoko panel — handles sidebar/floating/fullscreen internally */}
              <KiyokoPanel />
            </>
          )}
        </div>
      </SidebarInset>

      <SearchModal />
      <WorkspaceCreateModal />
      <SettingsModal />
      <ProjectCreatePanel />
      <CookieBanner />
    </SidebarProvider>
  );
}
