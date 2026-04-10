'use client';

import { useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useDashboard } from '@/providers/DashboardBootstrap';
import Link from 'next/link';
import {
  ChevronLeft, ChevronRight, Search, Settings2,
  FolderKanban, Film, LayoutGrid, Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils/cn';
import { useUIStore } from '@/stores/useUIStore';
import { NotificationBell } from './NotificationBell';

/* ── Route context ──────────────────────────────────────── */

type Scope = 'dashboard' | 'project' | 'video';

interface RouteContext {
  scope: Scope;
  label: string;
  icon: typeof LayoutGrid;
  showSettings: 'project' | 'video' | null;
  quickAction: { label: string; action: string } | null;
}

function deriveContext(pathname: string): RouteContext {
  const s = (pathname.replace(/\/+$/, '') || '/').split('/').filter(Boolean);

  if (s[0] === 'project' && s[1] && s[2] === 'video' && s[3]) {
    return { scope: 'video', label: 'Video', icon: Film, showSettings: 'video', quickAction: { label: 'Escena', action: 'scene' } };
  }
  if (s[0] === 'project' && s[1]) {
    return { scope: 'project', label: 'Proyecto', icon: FolderKanban, showSettings: 'project', quickAction: { label: 'Video', action: 'video' } };
  }
  return { scope: 'dashboard', label: 'Dashboard', icon: LayoutGrid, showSettings: null, quickAction: { label: 'Proyecto', action: 'project' } };
}

/* ── Breadcrumbs ────────────────────────────────────────── */

interface Crumb { label: string; href: string }

function buildCrumbs(pathname: string): Crumb[] {
  const s = pathname.split('/').filter(Boolean);
  const crumbs: Crumb[] = [];
  if (s[0] === 'project' && s[1]) {
    crumbs.push({ label: 'Proyecto', href: `/project/${s[1]}` });
    if (s[2] === 'video' && s[3]) {
      crumbs.push({ label: 'Video', href: `/project/${s[1]}/video/${s[3]}` });
      const sub: Record<string, string> = { scene: 'Escena', timeline: 'Timeline', narration: 'Narracion', analysis: 'Analisis', export: 'Exportar', share: 'Compartir' };
      if (s[4] && sub[s[4]]) crumbs.push({ label: sub[s[4]], href: pathname });
    } else if (s[2]) {
      const sub: Record<string, string> = { videos: 'Videos', resources: 'Recursos', publications: 'Publicaciones' };
      if (sub[s[2]]) crumbs.push({ label: sub[s[2]], href: pathname });
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
  const openProjectCreatePanel = useUIStore((s) => s.openProjectCreatePanel);
  const pageHeaderContext = useUIStore((s) => s.pageHeaderContext);

  const ctx = useMemo(() => deriveContext(pathname), [pathname]);
  const crumbs = useMemo(() => buildCrumbs(pathname), [pathname]);
  const showBack = useMemo(() => pageHeaderContext?.backHref === null ? false : pathname.split('/').filter(Boolean).length > 1, [pageHeaderContext?.backHref, pathname]);

  function goBack() {
    if (pageHeaderContext?.backHref) { router.push(pageHeaderContext.backHref); return; }
    if (typeof window !== 'undefined' && window.history.length > 1) { router.back(); return; }
    router.push('/dashboard');
  }

  function handleQuickAction() {
    if (ctx.quickAction?.action === 'project') openProjectCreatePanel();
    // video/scene creation is handled by the page itself via URL state
  }

  const iconBtn = 'flex items-center justify-center size-7 rounded-md text-muted-foreground hover:bg-accent hover:text-foreground transition-colors';

  return (
    <div className="flex items-center h-full w-full gap-2">
      {/* Left: back + breadcrumbs */}
      <div className="flex items-center gap-1 min-w-0 shrink-0">
        {showBack && (
          <button type="button" onClick={goBack} className={iconBtn} aria-label="Volver">
            <ChevronLeft className="size-4" />
          </button>
        )}

        <nav className="hidden md:flex items-center gap-0.5 text-xs min-w-0">
          {crumbs.length === 0 ? (
            <span className="text-muted-foreground font-medium">{ctx.label}</span>
          ) : (
            crumbs.map((c, i) => (
              <span key={c.href} className="flex items-center gap-0.5 min-w-0">
                {i > 0 && <ChevronRight className="size-3 text-muted-foreground/30 shrink-0" />}
                {i === crumbs.length - 1 ? (
                  <span className="text-foreground font-medium truncate max-w-[100px]">{c.label}</span>
                ) : (
                  <Link href={c.href} className="text-muted-foreground hover:text-foreground truncate max-w-[100px] transition-colors">
                    {c.label}
                  </Link>
                )}
              </span>
            ))
          )}
        </nav>
      </div>

      {/* Center: search — always centered */}
      <div className="flex-1 flex justify-center">
        <button type="button"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true, bubbles: true }))}
          className="flex items-center gap-2 h-7 px-3 rounded-md w-52 bg-accent/50 border border-border/50 text-xs text-muted-foreground hover:bg-accent hover:border-border transition-all">
          <Search size={12} className="shrink-0 opacity-50" />
          <span className="flex-1 text-left">{t('common.search')}</span>
          <kbd className="text-[9px] text-muted-foreground/40 bg-background/50 border border-border/50 rounded px-1 py-px">⌘K</kbd>
        </button>
      </div>

      {/* Right: quick action + settings + notifications */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Quick create button */}
        {ctx.quickAction && ctx.quickAction.action === 'project' && (
          <button type="button" onClick={handleQuickAction}
            className="hidden sm:flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors">
            <Plus className="size-3" />
            {ctx.quickAction.label}
          </button>
        )}

        {/* Settings */}
        {ctx.showSettings === 'project' && (
          <button type="button" onClick={() => openProjectSettingsModal('general')} className={iconBtn} aria-label="Ajustes" title="Ajustes del proyecto">
            <Settings2 size={14} />
          </button>
        )}
        {ctx.showSettings === 'video' && (
          <button type="button" onClick={() => openVideoSettingsModal('general')} className={iconBtn} aria-label="Ajustes" title="Ajustes del video">
            <Settings2 size={14} />
          </button>
        )}

        <NotificationBell />
      </div>
    </div>
  );
}
