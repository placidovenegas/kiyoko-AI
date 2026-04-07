'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/providers/DashboardBootstrap';
import {
  ChevronLeft,
  Search,
  Plus,
  Settings2,
  FolderKanban,
  Film,
  LayoutGrid,
} from 'lucide-react';
import { Tooltip as HeroTooltip } from '@heroui/react';

// HeroUI v3 Tooltip types don't expose content/placement in convenience API
const Tooltip = HeroTooltip as React.FC<{ content?: string; placement?: string; children: React.ReactNode }>;
import { Button } from '@heroui/react';
import { cn } from '@/lib/utils/cn';
import { FeedbackDialog } from '@/components/shared/FeedbackDialog';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useUIStore } from '@/stores/useUIStore';

function shouldShowBackButton(pathname: string): boolean {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  return cleanPath !== '/' && cleanPath !== '/dashboard' && cleanPath !== '/project';
}

type HeaderRouteContext = {
  scope: 'dashboard' | 'project' | 'video';
  label: string;
  icon: typeof LayoutGrid;
  showSearch: boolean;
  showFeedback: boolean;
  showGlobalTaskAction: boolean;
  showProjectSettings: boolean;
  showVideoSettings: boolean;
};

function deriveHeaderRouteContext(pathname: string): HeaderRouteContext {
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const segments = cleanPath.split('/').filter(Boolean);

  if (segments[0] === 'project' && segments[1] && segments[2] === 'video' && segments[3]) {
    const section = segments[4] ?? 'overview';
    const labelMap: Record<string, string> = {
      overview: 'Video',
      scenes: 'Escenas',
      scene: 'Escena',
      timeline: 'Timeline',
      narration: 'Narracion',
      analysis: 'Analisis',
      export: 'Exportacion',
      share: 'Compartir',
    };

    return {
      scope: 'video',
      label: labelMap[section] ?? 'Video',
      icon: Film,
      showSearch: true,
      showFeedback: false,
      showGlobalTaskAction: false,
      showProjectSettings: false,
      showVideoSettings: true,
    };
  }

  if (segments[0] === 'project' && segments[1]) {
    const section = segments[2] ?? 'overview';
    const labelMap: Record<string, string> = {
      overview: 'Proyecto',
      tasks: 'Tareas',
      videos: 'Videos',
      resources: 'Recursos',
      publications: 'Publicaciones',
      activity: 'Actividad',
      chat: 'IA',
    };

    return {
      scope: 'project',
      label: labelMap[section] ?? 'Proyecto',
      icon: FolderKanban,
      showSearch: true,
      showFeedback: false,
      showGlobalTaskAction: false,
      showProjectSettings: true,
      showVideoSettings: false,
    };
  }

  const dashboardLabelMap: Record<string, string> = {
    dashboard: 'Dashboard',
    tasks: 'Tareas',
    settings: 'Ajustes',
    admin: 'Admin',
    share: 'Compartido',
  };

  return {
    scope: 'dashboard',
    label: dashboardLabelMap[segments[0] ?? 'dashboard'] ?? 'Workspace',
    icon: LayoutGrid,
    showSearch: true,
    showFeedback: true,
    showGlobalTaskAction: true,
    showProjectSettings: false,
    showVideoSettings: false,
  };
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  useDashboard();
  const openTaskCreatePanel = useUIStore((s) => s.openTaskCreatePanel);
  const openProjectSettingsModal = useUIStore((s) => s.openProjectSettingsModal);
  const openVideoSettingsModal = useUIStore((s) => s.openVideoSettingsModal);
  const pageHeaderContext = useUIStore((s) => s.pageHeaderContext);

  // Feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  /* ---- Derived ---- */
  const routeContext = useMemo(() => deriveHeaderRouteContext(pathname), [pathname]);
  const showBackButton = useMemo(() => pageHeaderContext?.backHref === null ? false : shouldShowBackButton(pathname), [pageHeaderContext?.backHref, pathname]);

  const chromeButtonClassName = 'flex items-center justify-center size-8 rounded-md border border-foreground/8 bg-background text-foreground/45 hover:bg-foreground/4 hover:text-foreground/75 transition-all duration-150';
  const chromeTextButtonClassName = 'shrink-0 rounded-md border border-foreground/8 bg-background px-2.5 py-1 text-[12px] text-foreground/45 hover:bg-foreground/4 hover:text-foreground/75 transition-all duration-150';

  function handleGoBack() {
    if (pageHeaderContext?.backHref) {
      router.push(pageHeaderContext.backHref);
      return;
    }

    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
      return;
    }

    router.push('/dashboard');
  }

  return (
    <div className="flex items-center h-full px-3 w-full">
      <div className="flex flex-1 items-center gap-2">
        {showBackButton ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            isIconOnly
            onPress={handleGoBack}
            className={cn(chromeButtonClassName, 'shrink-0')}
            aria-label="Volver"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        ) : null}

        <div className="hidden min-w-0 items-center gap-2 md:flex">
          <span className="inline-flex h-8 items-center gap-2 rounded-full border border-border bg-background px-3 text-xs font-medium text-muted-foreground">
            <routeContext.icon className="h-3.5 w-3.5 text-primary" />
            {routeContext.label}
          </span>
        </div>
      </div>

      {/* Search — center of navbar, always visible */}
      {routeContext.showSearch ? (
        <Button
          type="button"
          variant="ghost"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className={cn(
            'flex items-center gap-2 h-8 px-3 rounded-md',
            routeContext.scope === 'dashboard' ? 'w-64' : 'w-52 lg:w-60',
            'bg-background border border-foreground/8',
            'text-sm text-foreground/40 hover:text-foreground/70 hover:bg-foreground/6 hover:border-foreground/15',
            'transition-all duration-150',
          )}
        >
          <Search size={14} className="shrink-0" />
          <span className="flex-1 text-left text-[13px]">{t('common.search')}</span>
          <kbd className="shrink-0 text-[10px] font-medium text-foreground/25 bg-foreground/6 border border-foreground/10 rounded px-1 py-0.5">
            ⌘K
          </kbd>
        </Button>
      ) : null}

      {/* Spacer right */}
      <div className="flex-1" />

      {/* Feedback */}
      {routeContext.showFeedback ? (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setFeedbackOpen(true)}
          className={cn(chromeTextButtonClassName, 'mr-1.5')}
        >
          {t('nav.feedback')}
        </Button>
      ) : null}

      {routeContext.showGlobalTaskAction ? (
        <>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => openTaskCreatePanel({ source: 'header' })}
            isIconOnly
            className={cn(chromeButtonClassName, 'shrink-0 mr-1.5 lg:hidden')}
            aria-label="Nueva tarea"
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onPress={() => openTaskCreatePanel({ source: 'header' })}
            className={cn(chromeTextButtonClassName, 'mr-1.5 hidden lg:inline-flex')}
          >
            <Plus className="mr-1.5 h-3.5 w-3.5" />
            Nueva tarea
          </Button>
        </>
      ) : null}

      {/* RIGHT: icons */}
      <div className="flex items-center gap-1 shrink-0">
        {routeContext.showProjectSettings ? (
          <Tooltip content="Ajustes del proyecto" placement="bottom">
            <button
              type="button"
              onClick={() => openProjectSettingsModal('general')}
              className={chromeButtonClassName}
              aria-label="Ajustes del proyecto"
            >
              <Settings2 size={14} />
            </button>
          </Tooltip>
        ) : null}

        {routeContext.showVideoSettings ? (
          <Tooltip content="Ajustes del video" placement="bottom">
            <button
              type="button"
              onClick={() => openVideoSettingsModal('general')}
              className={chromeButtonClassName}
              aria-label="Ajustes del video"
            >
              <Settings2 size={14} />
            </button>
          </Tooltip>
        ) : null}

        {/* Notifications */}
        <NotificationBell />
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
