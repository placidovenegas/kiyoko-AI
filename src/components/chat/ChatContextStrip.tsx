'use client';

import { ChevronDown, ChevronRight, MapPin } from 'lucide-react';
import { Fragment, useId, useState } from 'react';
import type { ContextLevel } from '@/types/ai-context';
import type { DashboardContextStatsLite } from '@/lib/chat/fetch-dashboard-context-stats';
import type { ProjectContextStatsLite } from '@/lib/chat/fetch-project-context-stats';

const LEVEL_SHORT: Record<ContextLevel, string> = {
  dashboard: 'Dashboard',
  organization: 'Organización',
  project: 'Proyecto',
  video: 'Vídeo',
  scene: 'Escena',
};

export interface ChatContextStripProps {
  contextLevel: ContextLevel;
  projectTitle: string | null;
  videoTitle: string | null;
  /** p.ej. `#3 · Hook` */
  sceneLabel: string | null;
  /** Mientras carga título de proyecto desde URL */
  projectLoading?: boolean;
  /** Conteos del proyecto (opcional) */
  stats?: ProjectContextStatsLite | null;
  statsLoading?: boolean;
  /** Dashboard / org: agregado sin proyecto en pantalla */
  dashboardStats?: DashboardContextStatsLite | null;
  dashboardStatsLoading?: boolean;
  /** BYOK: claves activas del usuario (no del proyecto) */
  userApiKeyCount?: number | null;
  userApiKeyLoading?: boolean;
}

/**
 * Muestra la jerarquía de contexto que la IA debe asumir (paridad con `buildContextClientHint`).
 */
export function ChatContextStrip({
  contextLevel,
  projectTitle,
  videoTitle,
  sceneLabel,
  projectLoading,
  stats,
  statsLoading,
  dashboardStats,
  dashboardStatsLoading,
  userApiKeyCount,
  userApiKeyLoading,
}: ChatContextStripProps) {
  const [open, setOpen] = useState(true);
  const panelId = useId();

  const projectVal =
    contextLevel === 'dashboard' || contextLevel === 'organization'
      ? '—'
      : projectLoading
        ? 'Cargando…'
        : projectTitle ?? '—';

  const videoVal =
    contextLevel === 'video' || contextLevel === 'scene'
      ? videoTitle ?? '—'
      : '—';

  const sceneVal = contextLevel === 'scene' ? sceneLabel ?? '—' : '—';

  const visibleRows = [
    { key: 'level', label: 'Nivel', value: LEVEL_SHORT[contextLevel] },
    { key: 'project', label: 'Proyecto', value: projectVal },
    { key: 'video', label: 'Vídeo', value: videoVal },
    { key: 'scene', label: 'Escena', value: sceneVal },
  ];

  const pathSummary = [
    LEVEL_SHORT[contextLevel],
    projectTitle ?? '',
    videoTitle ?? '',
    sceneLabel ?? '',
  ]
    .filter(Boolean)
    .join(' · ');

  const showWorkspaceStrip =
    (contextLevel === 'dashboard' || contextLevel === 'organization') && !stats;

  const statsSuffixFull =
    stats && !statsLoading
      ? ` · ${stats.projectsInScopeCount} proj · ${stats.openTaskCount}/${stats.totalTaskCount} tareas · ${stats.characterCount}p/${stats.backgroundCount}b`
      : showWorkspaceStrip && dashboardStats && !dashboardStatsLoading
        ? ` · ${dashboardStats.projectCount} proj · ${dashboardStats.videoCount} vid · ${dashboardStats.openTaskCount}/${dashboardStats.totalTaskCount} tar · ${dashboardStats.sceneCount} esc`
        : '';
  /** Dashboard: sin p/b; proyecto: incluye personajes/fondos */
  const statsSuffixCompact =
    stats && !statsLoading
      ? ` · ${stats.projectsInScopeCount}·${stats.openTaskCount}/${stats.totalTaskCount}·${stats.characterCount}p/${stats.backgroundCount}b`
      : showWorkspaceStrip && dashboardStats && !dashboardStatsLoading
        ? ` · ${dashboardStats.projectCount}·${dashboardStats.videoCount}·${dashboardStats.openTaskCount}/${dashboardStats.totalTaskCount}·${dashboardStats.sceneCount}esc`
        : '';

  const byokFull =
    userApiKeyCount != null && !userApiKeyLoading ? ` · ${userApiKeyCount} API` : '';
  const byokCompact =
    userApiKeyCount != null && !userApiKeyLoading ? ` · ${userApiKeyCount}k` : '';

  const chipTitle = [
    pathSummary,
    stats && !statsLoading
      ? `${stats.projectsInScopeCount} proj · ${stats.openTaskCount}/${stats.totalTaskCount} tareas · ${stats.characterCount}p/${stats.backgroundCount}b`
      : showWorkspaceStrip && dashboardStats && !dashboardStatsLoading
        ? `${dashboardStats.projectCount} proj · ${dashboardStats.videoCount} víd · ${dashboardStats.openTaskCount}/${dashboardStats.totalTaskCount} tareas · ${dashboardStats.sceneCount} esc (sin pers./fondos en dashboard)`
        : '',
    userApiKeyCount != null && !userApiKeyLoading ? `${userApiKeyCount} clave(s) API` : '',
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <div className="border-b border-border/80 bg-muted/30 dark:bg-muted/15">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-none"
        aria-expanded={open}
        aria-controls={panelId}
        title={chipTitle || undefined}
      >
        <MapPin size={12} className="shrink-0 text-primary/80" aria-hidden />
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0 max-sm:hidden">
          Contexto para la IA
        </span>
        <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground shrink-0 sm:hidden">
          IA
        </span>
        <span className="text-[10px] text-muted-foreground/80 truncate flex-1 min-w-0">
          {LEVEL_SHORT[contextLevel]}
          {projectTitle ? ` · ${projectTitle}` : ''}
          {videoTitle ? ` · ${videoTitle}` : ''}
          {sceneLabel ? ` · ${sceneLabel}` : ''}
          <span className="sm:hidden">
            {statsSuffixCompact}
            {byokCompact}
          </span>
          <span className="hidden sm:inline">
            {statsSuffixFull}
            {byokFull}
          </span>
        </span>
        {open ? <ChevronDown size={14} className="shrink-0 text-muted-foreground" /> : <ChevronRight size={14} className="shrink-0 text-muted-foreground" />}
      </button>
      <div id={panelId} hidden={!open} className="px-3 pb-2.5 pt-0 space-y-1.5">
          {visibleRows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-[11px] leading-snug"
            >
              <span className="text-muted-foreground font-medium">{row.label}</span>
              <span className="text-foreground/90 wrap-break-word min-w-0">{row.value}</span>
            </div>
          ))}
          {(userApiKeyLoading || userApiKeyCount != null) && (
            <div className="grid grid-cols-[4.5rem_1fr] gap-x-2 gap-y-0.5 text-[11px] leading-snug pt-0.5 border-t border-border/40">
              <span className="text-muted-foreground font-medium">BYOK</span>
              <span className="text-foreground/90 min-w-0">
                {userApiKeyLoading
                  ? 'Cargando…'
                  : `${userApiKeyCount ?? 0} clave(s) API propia(s) activa(s)`}
              </span>
            </div>
          )}
          {(statsLoading || stats) && (
            <div className="pt-1 border-t border-border/60 mt-1.5 space-y-1" aria-busy={statsLoading}>
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Resumen del contexto</p>
              {statsLoading ? (
                <p className="text-[11px] text-muted-foreground">Cargando conteos…</p>
              ) : stats ? (
                <ul className="text-[11px] text-foreground/85 space-y-0.5 list-disc list-inside">
                  <li>Proyectos en el ámbito (org o cuenta): {stats.projectsInScopeCount}</li>
                  <li>
                    En este proyecto — tareas: {stats.openTaskCount} abiertas, {stats.totalTaskCount} totales
                  </li>
                  <li>
                    Vídeos {stats.videoCount} · Personajes {stats.characterCount} · Fondos {stats.backgroundCount} · Escenas{' '}
                    {stats.sceneCount}
                  </li>
                  {stats.scenesInCurrentVideo != null && (
                    <li>Escenas en el vídeo actual: {stats.scenesInCurrentVideo}</li>
                  )}
                </ul>
              ) : (
                <p className="text-[11px] text-muted-foreground">No se pudieron cargar los conteos.</p>
              )}
            </div>
          )}
          {showWorkspaceStrip && (dashboardStatsLoading || dashboardStats) && (
            <div
              className="pt-1 border-t border-border/60 mt-1.5 space-y-1"
              aria-busy={dashboardStatsLoading}
            >
              <p className="text-[10px] font-medium text-slate-500 dark:text-slate-400">Resumen del espacio</p>
              {dashboardStatsLoading ? (
                <p className="text-[11px] text-muted-foreground">Cargando conteos…</p>
              ) : dashboardStats ? (
                <Fragment>
                  <ul className="text-[11px] text-foreground/85 space-y-0.5 list-disc list-inside">
                    <li>
                      Proyectos {dashboardStats.projectCount} · Vídeos {dashboardStats.videoCount} · Escenas{' '}
                      {dashboardStats.sceneCount} · Tareas {dashboardStats.openTaskCount} abiertas (
                      {dashboardStats.totalTaskCount} totales)
                    </li>
                  </ul>
                  <p className="text-muted-foreground text-[10px] pt-0.5 pl-1">
                    Personajes y fondos no se incluyen en este resumen; al abrir un proyecto sí.
                  </p>
                </Fragment>
              ) : (
                <p className="text-[11px] text-muted-foreground">No se pudieron cargar los conteos.</p>
              )}
            </div>
          )}
          <p className="text-[10px] text-muted-foreground/90 pt-1 border-t border-border/60 mt-1.5">
            Este resumen se envía con cada mensaje para que Kiyoko no pida datos que ya están en pantalla.
          </p>
        </div>
    </div>
  );
}
