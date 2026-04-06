'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import {
  Sun,
  Moon,
  Search,
  MessageCircle,
  ChevronLeft,
  LayoutGrid,
  FolderKanban,
  Film,
  Plus,
  Settings2,
} from 'lucide-react';
import { Tooltip } from '@heroui/react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { FeedbackDialog } from '@/components/shared/FeedbackDialog';
import { NotificationBell } from '@/components/layout/NotificationBell';
import { useUIStore } from '@/stores/useUIStore';

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const THEME_STORAGE_KEY = 'kiyoko-theme';

/** Paths where the back button should NOT appear */
const NO_BACK_PATHS = ['/', '/dashboard', '/project'];

/* ------------------------------------------------------------------ */
/*  Context helpers                                                    */
/* ------------------------------------------------------------------ */

type PageContext = 'dashboard' | 'project' | 'video' | 'other';

function resolveContext(pathname: string): PageContext {
  // Video: /project/[shortId]/video/*
  if (/^\/project\/[^/]+\/video/.test(pathname)) return 'video';
  // Project: /project/[shortId]/* (but not video, caught above)
  if (/^\/project\/[^/]+/.test(pathname)) return 'project';
  // Dashboard
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return 'dashboard';
  return 'other';
}

interface BreadcrumbInfo {
  icon: typeof LayoutGrid;
  label: string;
}

function resolveBreadcrumb(pathname: string, ctx: PageContext): BreadcrumbInfo | null {
  switch (ctx) {
    case 'dashboard': {
      if (pathname.startsWith('/dashboard/tasks') || pathname.startsWith('/dashboard/tareas'))
        return { icon: LayoutGrid, label: 'Tareas' };
      if (pathname.startsWith('/dashboard/settings') || pathname.startsWith('/dashboard/ajustes'))
        return { icon: LayoutGrid, label: 'Ajustes' };
      return { icon: LayoutGrid, label: 'Dashboard' };
    }
    case 'project':
      return { icon: FolderKanban, label: 'Proyecto' };
    case 'video':
      return { icon: Film, label: 'Video' };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/*  Header                                                             */
/* ------------------------------------------------------------------ */

interface HeaderProps {
  onToggleChat?: () => void;
  chatOpen?: boolean;
}

export function Header({ onToggleChat, chatOpen }: HeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const ctx = useMemo(() => resolveContext(pathname), [pathname]);
  const breadcrumb = useMemo(() => resolveBreadcrumb(pathname, ctx), [pathname, ctx]);

  const openTaskCreatePanel = useUIStore((s) => s.openTaskCreatePanel);
  const openProjectSettingsModal = useUIStore((s) => s.openProjectSettingsModal);
  const openVideoSettingsModal = useUIStore((s) => s.openVideoSettingsModal);

  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      if (stored === 'light' || stored === 'dark') return stored;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Feedback
  const [feedbackOpen, setFeedbackOpen] = useState(false);

  /* ---- Show back button? ---- */
  const showBack = !NO_BACK_PATHS.includes(pathname);

  /* ---- Handlers ---- */
  function handleToggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem(THEME_STORAGE_KEY, next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.setAttribute('data-theme', next);
  }

  /* ---- Icon button style (shared) ---- */
  const iconBtnClass =
    'flex items-center justify-center size-8 rounded-md border border-foreground/6 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4 transition-all duration-150';

  return (
    <div className="flex items-center h-full px-3 w-full">
      {/* ===== LEFT SECTION ===== */}
      <div className="flex items-center gap-2 flex-1 min-w-0">
        {/* Back button */}
        {showBack && (
          <Tooltip>
            <Tooltip.Trigger>
              <button
                type="button"
                onClick={() => router.back()}
                className={iconBtnClass}
                aria-label="Volver"
              >
                <ChevronLeft size={16} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Volver</Tooltip.Content>
          </Tooltip>
        )}

        {/* Breadcrumb badge */}
        {breadcrumb && (
          <div className="hidden md:flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground/70">
            <breadcrumb.icon size={13} className="shrink-0" />
            <span>{breadcrumb.label}</span>
          </div>
        )}
      </div>

      {/* ===== CENTER SECTION (search) ===== */}
      <Button
        type="button"
        variant="ghost"
        onClick={() =>
          document.dispatchEvent(
            new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }),
          )
        }
        className={cn(
          'flex items-center gap-2 h-8 w-64 px-3 rounded-lg',
          'bg-foreground/4 border border-foreground/8',
          'text-sm text-foreground/40 hover:text-foreground/70 hover:bg-foreground/6 hover:border-foreground/15',
          'transition-all duration-150',
        )}
      >
        <Search size={14} className="shrink-0" />
        <span className="flex-1 text-left text-[13px]">Buscar...</span>
        <kbd className="shrink-0 text-[10px] font-medium text-foreground/25 bg-foreground/6 border border-foreground/10 rounded px-1 py-0.5">
          ⌘K
        </kbd>
      </Button>

      {/* ===== RIGHT SECTION (context-aware) ===== */}
      <div className="flex items-center gap-1 flex-1 justify-end shrink-0">
        {/* --- Dashboard context --- */}
        {ctx === 'dashboard' && (
          <>
            {/* Feedback */}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setFeedbackOpen(true)}
              className="shrink-0 mr-1 px-2.5 py-1 rounded-md border border-foreground/8 text-[12px] text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4"
            >
              Feedback
            </Button>

            {/* Nueva tarea */}
            <Tooltip>
              <Tooltip.Trigger>
                <button
                  type="button"
                  onClick={() => openTaskCreatePanel()}
                  className={cn(
                    'flex items-center gap-1.5 h-8 rounded-md border border-foreground/6 px-2 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4 transition-all duration-150',
                  )}
                >
                  <Plus size={14} />
                  <span className="hidden lg:inline text-xs font-medium">Nueva tarea</span>
                </button>
              </Tooltip.Trigger>
              <Tooltip.Content>Nueva tarea</Tooltip.Content>
            </Tooltip>
          </>
        )}

        {/* --- Project context --- */}
        {ctx === 'project' && (
          <Tooltip>
            <Tooltip.Trigger>
              <button
                type="button"
                onClick={() => openProjectSettingsModal()}
                className={iconBtnClass}
                aria-label="Ajustes del proyecto"
              >
                <Settings2 size={14} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Ajustes del proyecto</Tooltip.Content>
          </Tooltip>
        )}

        {/* --- Video context --- */}
        {ctx === 'video' && (
          <Tooltip>
            <Tooltip.Trigger>
              <button
                type="button"
                onClick={() => openVideoSettingsModal()}
                className={iconBtnClass}
                aria-label="Ajustes del video"
              >
                <Settings2 size={14} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>Ajustes del video</Tooltip.Content>
          </Tooltip>
        )}

        {/* Theme toggle (always) */}
        <Tooltip>
          <Tooltip.Trigger>
            <button
              type="button"
              onClick={handleToggleTheme}
              className={iconBtnClass}
              aria-label={theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}
            >
              {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
            </button>
          </Tooltip.Trigger>
          <Tooltip.Content>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</Tooltip.Content>
        </Tooltip>

        {/* Notifications (always) */}
        <NotificationBell />

        {/* Chat/Bot (always, context-aware tooltip) */}
        {onToggleChat && (
          <Tooltip>
            <Tooltip.Trigger>
              <button
                type="button"
                onClick={onToggleChat}
                className={cn(
                  'flex items-center justify-center size-8 rounded-md border transition-all duration-150',
                  chatOpen
                    ? 'border-primary/30 text-primary bg-primary/10'
                    : 'border-foreground/6 text-foreground/40 hover:text-foreground/70 hover:bg-foreground/4',
                )}
              >
                <MessageCircle size={14} />
              </button>
            </Tooltip.Trigger>
            <Tooltip.Content>
              {ctx === 'dashboard' ? 'Chat IA' : 'Asistente contextual'}
            </Tooltip.Content>
          </Tooltip>
        )}
      </div>

      {/* Feedback Dialog */}
      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
