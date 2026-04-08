/**
 * Centralized status constants for scenes, videos, and projects.
 * Import from here — NEVER define locally in components/pages.
 */

/* ── Scene Status ─────────────────────────────────────────── */

export const SCENE_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompt_ready: 'Prompt listo',
  generating: 'Generando',
  generated: 'Generado',
  approved: 'Aprobado',
  rejected: 'Rechazado',
};

export const SCENE_STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-500',
  prompt_ready: 'bg-blue-500',
  generating: 'bg-amber-500 animate-pulse',
  generated: 'bg-purple-500',
  approved: 'bg-emerald-500',
  rejected: 'bg-red-500',
};

export const SCENE_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  prompt_ready: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  generating: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  generated: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  rejected: 'bg-red-500/15 text-red-400 border-red-500/20',
};

/* ── Arc Phase ────────────────────────────────────────────── */

export const PHASE_STYLES: Record<string, string> = {
  hook: 'bg-red-500/80 text-white',
  build: 'bg-amber-500/80 text-white',
  peak: 'bg-emerald-500/80 text-white',
  close: 'bg-blue-500/80 text-white',
};

export const PHASE_BADGE: Record<string, string> = {
  hook: 'bg-red-500/20 text-red-400 border-red-500/30',
  build: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  peak: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  close: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export const PHASE_LABELS: Record<string, string> = {
  hook: 'Hook',
  build: 'Build',
  peak: 'Peak',
  close: 'Close',
};

export const PHASE_HEX: Record<string, string> = {
  hook: '#EF4444',
  build: '#F59E0B',
  peak: '#10B981',
  close: '#3B82F6',
};

/* ── Video Status ─────────────────────────────────────────── */

export const VIDEO_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  prompting: 'Prompts',
  generating: 'Generando',
  review: 'Revision',
  approved: 'Aprobado',
  exported: 'Exportado',
};

export const VIDEO_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/20',
  prompting: 'bg-blue-500/15 text-blue-400 border-blue-500/20',
  generating: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  review: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
  approved: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
  exported: 'bg-emerald-500/15 text-emerald-600 border-emerald-500/20',
};

export const VIDEO_STATUS_DOT: Record<string, string> = {
  draft: 'bg-zinc-400',
  prompting: 'bg-blue-400',
  generating: 'bg-amber-400',
  review: 'bg-purple-400',
  approved: 'bg-emerald-400',
  exported: 'bg-emerald-600',
};

/* ── Project Status ───────────────────────────────────────── */

export const PROJECT_STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En progreso',
  review: 'Revision',
  completed: 'Completado',
  archived: 'Archivado',
};

export const PROJECT_STATUS_BADGE: Record<string, string> = {
  draft: 'bg-zinc-500/15 text-zinc-400',
  in_progress: 'bg-blue-500/15 text-blue-400',
  review: 'bg-purple-500/15 text-purple-400',
  completed: 'bg-emerald-500/15 text-emerald-400',
  archived: 'bg-zinc-500/15 text-zinc-500',
};
