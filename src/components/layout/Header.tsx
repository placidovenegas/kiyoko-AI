'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/providers/DashboardBootstrap';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Search, Settings2,
  FolderKanban, Film, LayoutGrid, Sparkles, Download, Copy,
} from 'lucide-react';
import { Tooltip as HeroTooltip, Button } from '@heroui/react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { NotificationBell } from './NotificationBell';
import { FeedbackDialog } from '@/components/shared/FeedbackDialog';
// Breadcrumb names derived from URL segments (context-free)

const Tooltip = HeroTooltip as React.FC<{ content?: string; placement?: string; children: React.ReactNode }>;

/* ── Helpers ────────────────────────────────────────────── */

function shouldShowBackButton(pathname: string): boolean {
  const depth = pathname.split('/').filter(Boolean).length;
  return depth > 1;
}

/* ── Route context ──────────────────────────────────────── */

interface HeaderRouteContext {
  scope: 'dashboard' | 'project' | 'video';
  label: string;
  icon: typeof LayoutGrid;
  showSearch: boolean;
  showFeedback: boolean;
  showProjectSettings: boolean;
  showVideoSettings: boolean;
}

function deriveHeaderRouteContext(pathname: string): HeaderRouteContext {
  const segments = (pathname.replace(/\/+$/, '') || '/').split('/').filter(Boolean);

  if (segments[0] === 'project' && segments[1] && segments[2] === 'video' && segments[3]) {
    const section = segments[4] ?? 'overview';
    const labelMap: Record<string, string> = {
      overview: 'Video', scene: 'Escena', timeline: 'Timeline',
      narration: 'Narracion', analysis: 'Analisis', export: 'Exportar', share: 'Compartir',
    };
    return { scope: 'video', label: labelMap[section] ?? 'Video', icon: Film, showSearch: true, showFeedback: false, showProjectSettings: false, showVideoSettings: true };
  }

  if (segments[0] === 'project' && segments[1]) {
    const section = segments[2] ?? 'overview';
    const labelMap: Record<string, string> = {
      overview: 'Proyecto', videos: 'Videos', resources: 'Recursos',
      publications: 'Publicaciones', activity: 'Actividad', chat: 'IA',
    };
    return { scope: 'project', label: labelMap[section] ?? 'Proyecto', icon: FolderKanban, showSearch: true, showFeedback: false, showProjectSettings: true, showVideoSettings: false };
  }

  const labelMap: Record<string, string> = { dashboard: 'Dashboard', settings: 'Ajustes', admin: 'Admin' };
  return { scope: 'dashboard', label: labelMap[segments[0] ?? 'dashboard'] ?? 'Workspace', icon: LayoutGrid, showSearch: true, showFeedback: true, showProjectSettings: false, showVideoSettings: false };
}

/* ── Breadcrumbs builder ────────────────────────────────── */

interface Crumb { label: string; href: string }

function buildBreadcrumbs(pathname: string): Crumb[] {
  const segments = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];

  if (segments[0] === 'project' && segments[1]) {
    crumbs.push({ label: 'Proyecto', href: `/project/${segments[1]}` });

    if (segments[2] === 'video' && segments[3]) {
      crumbs.push({ label: 'Video', href: `/project/${segments[1]}/video/${segments[3]}` });

      if (segments[4] === 'scene' && segments[5]) {
        crumbs.push({ label: `Escena`, href: pathname });
      } else if (segments[4] && segments[4] !== 'overview') {
        const sectionLabels: Record<string, string> = {
          timeline: 'Timeline', narration: 'Narracion', analysis: 'Analisis',
          export: 'Exportar', share: 'Compartir',
        };
        if (sectionLabels[segments[4]]) {
          crumbs.push({ label: sectionLabels[segments[4]], href: pathname });
        }
      }
    } else if (segments[2] && segments[2] !== 'overview') {
      const sectionLabels: Record<string, string> = {
        videos: 'Videos', resources: 'Recursos', publications: 'Publicaciones',
      };
      if (sectionLabels[segments[2]]) {
        crumbs.push({ label: sectionLabels[segments[2]], href: pathname });
      }
    }
  }

  return crumbs;
}

/* ── Header ─────────────────────────────────────────────── */

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations();

  useDashboard();
  const openProjectSettingsModal = useUIStore((s) => s.openProjectSettingsModal);
  const openVideoSettingsModal = useUIStore((s) => s.openVideoSettingsModal);
  const pageHeaderContext = useUIStore((s) => s.pageHeaderContext);

  const [feedbackOpen, setFeedbackOpen] = useState(false);

  const routeContext = useMemo(() => deriveHeaderRouteContext(pathname), [pathname]);
  const showBackButton = useMemo(() => pageHeaderContext?.backHref === null ? false : shouldShowBackButton(pathname), [pageHeaderContext?.backHref, pathname]);

  const breadcrumbs = useMemo(() => buildBreadcrumbs(pathname), [pathname]);

  const chromeBtn = 'flex items-center justify-center size-8 rounded-md border border-foreground/8 bg-background text-foreground/45 hover:bg-foreground/4 hover:text-foreground/75 transition-all duration-150';
  const chromeTxtBtn = 'shrink-0 rounded-md border border-foreground/8 bg-background px-2.5 py-1 text-[12px] text-foreground/45 hover:bg-foreground/4 hover:text-foreground/75 transition-all duration-150';

  function handleGoBack() {
    if (pageHeaderContext?.backHref) { router.push(pageHeaderContext.backHref); return; }
    if (typeof window !== 'undefined' && window.history.length > 1) { router.back(); return; }
    router.push('/dashboard');
  }

  return (
    <div className="flex items-center h-full px-3 w-full">
      {/* Left: back + breadcrumbs */}
      <div className="flex flex-1 items-center gap-1.5 min-w-0">
        {showBackButton && (
          <Button type="button" variant="ghost" size="sm" isIconOnly onPress={handleGoBack}
            className={cn(chromeBtn, 'shrink-0')} aria-label="Volver">
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
        )}

        {/* Breadcrumbs */}
        <nav className="hidden md:flex items-center gap-1 min-w-0 text-xs">
          {breadcrumbs.length === 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-background px-2.5 py-1 text-muted-foreground">
              <routeContext.icon className="h-3.5 w-3.5 text-primary" />
              {routeContext.label}
            </span>
          ) : (
            breadcrumbs.map((crumb, i) => (
              <span key={crumb.href} className="flex items-center gap-1 min-w-0">
                {i > 0 && <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-foreground font-medium truncate max-w-[120px]">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="text-muted-foreground hover:text-foreground truncate max-w-[120px] transition-colors">
                    {crumb.label}
                  </Link>
                )}
              </span>
            ))
          )}
        </nav>
      </div>

      {/* Center: search */}
      {routeContext.showSearch && (
        <Button type="button" variant="ghost"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className={cn('flex items-center gap-2 h-8 px-3 rounded-md', routeContext.scope === 'dashboard' ? 'w-64' : 'w-48',
            'bg-background border border-foreground/8 text-sm text-foreground/40 hover:text-foreground/70 hover:bg-foreground/6 transition-all duration-150')}>
          <Search size={14} className="shrink-0" />
          <span className="flex-1 text-left text-[13px]">{t('common.search')}</span>
          <kbd className="shrink-0 text-[10px] font-medium text-foreground/25 bg-foreground/6 border border-foreground/10 rounded px-1 py-0.5">⌘K</kbd>
        </Button>
      )}

      <div className="flex-1" />

      {/* Feedback */}
      {routeContext.showFeedback && (
        <Button type="button" variant="ghost" size="sm" onClick={() => setFeedbackOpen(true)} className={cn(chromeTxtBtn, 'mr-1.5')}>
          {t('nav.feedback')}
        </Button>
      )}

      {/* Right: contextual actions + settings */}
      <div className="flex items-center gap-1 shrink-0">
        {routeContext.showProjectSettings && (
          <Tooltip content="Ajustes del proyecto" placement="bottom">
            <button type="button" onClick={() => openProjectSettingsModal('general')} className={chromeBtn} aria-label="Ajustes del proyecto">
              <Settings2 size={14} />
            </button>
          </Tooltip>
        )}
        {routeContext.showVideoSettings && (
          <>
            <Tooltip content="Ajustes del video" placement="bottom">
              <button type="button" onClick={() => openVideoSettingsModal('general')} className={chromeBtn} aria-label="Ajustes del video">
                <Settings2 size={14} />
              </button>
            </Tooltip>
          </>
        )}
        <NotificationBell />
      </div>

      <FeedbackDialog open={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </div>
  );
}
