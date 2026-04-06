import type { ContextLevel } from '@/types/ai-context';
import type { DashboardContextStatsLite } from '@/lib/chat/fetch-dashboard-context-stats';
import type { ProfileCreativeContextLite } from '@/lib/chat/fetch-profile-creative-context';
import type { ProjectContextStatsLite } from '@/lib/chat/fetch-project-context-stats';

export interface ContextClientHintParams {
  contextLevel: ContextLevel;
  projectTitle: string | null;
  videoTitle: string | null;
  /** p.ej. `#3 · Título escena` */
  sceneLabel: string | null;
  projectId: string | null;
  videoId: string | null;
  sceneId: string | null;
  /** Conteos del proyecto (y del vídeo activo si aplica) */
  stats?: ProjectContextStatsLite | null;
  /** Dashboard / org: agregado sobre proyectos visibles (sin project_id en pantalla) */
  dashboardStats?: DashboardContextStatsLite | null;
  /** Claves BYOK activas del usuario (no del proyecto) */
  activeUserApiKeyCount?: number | null;
  /** Preferencias creativas del perfil (tipos de vídeo, propósito) */
  profileCreative?: ProfileCreativeContextLite | null;
}

const LEVEL_ES: Record<ContextLevel, string> = {
  dashboard: 'Dashboard (sin proyecto activo en pantalla)',
  project: 'Vista proyecto',
  video: 'Vista vídeo',
  scene: 'Vista escena',
};

/**
 * Texto que se añade al system prompt para que el modelo comparta el mismo
 * contexto de navegación que ve el usuario (títulos + IDs para desambiguación).
 */
export function buildContextClientHint(p: ContextClientHintParams): string {
  const lines: string[] = [];
  lines.push(`Nivel de navegación: ${LEVEL_ES[p.contextLevel]}`);

  if (p.projectId) {
    lines.push(`project_id: ${p.projectId}`);
    if (p.projectTitle) lines.push(`Proyecto visible: "${p.projectTitle}"`);
  } else if (p.contextLevel !== 'dashboard') {
    lines.push('(Sin project_id en sesión — desambigua proyecto si hace falta.)');
  }

  if (p.videoId) {
    lines.push(`video_id: ${p.videoId}`);
    if (p.videoTitle) lines.push(`Vídeo visible: "${p.videoTitle}"`);
  }

  if (p.sceneId) {
    lines.push(`scene_id: ${p.sceneId}`);
    if (p.sceneLabel) lines.push(`Escena activa: ${p.sceneLabel}`);
  }

  if (p.stats && p.projectId) {
    lines.push(
      `Proyectos en el mismo ámbito (organización o cuenta): ${p.stats.projectsInScopeCount}.`,
    );
    lines.push(
      `En este proyecto (conteos reales): tareas ${p.stats.openTaskCount} abiertas de ${p.stats.totalTaskCount} totales; vídeos ${p.stats.videoCount}, personajes ${p.stats.characterCount}, fondos ${p.stats.backgroundCount}, escenas ${p.stats.sceneCount}.`,
    );
    if (p.videoId && p.stats.scenesInCurrentVideo != null) {
      lines.push(`En el vídeo activo hay ${p.stats.scenesInCurrentVideo} escena(s).`);
    }
  }

  if (!p.projectId && p.dashboardStats) {
    lines.push(
      `Resumen del espacio (solo nivel cuenta; sin personajes ni fondos): ${p.dashboardStats.projectCount} proyecto(s); tareas ${p.dashboardStats.openTaskCount} abiertas de ${p.dashboardStats.totalTaskCount} totales; ${p.dashboardStats.videoCount} vídeo(s) y ${p.dashboardStats.sceneCount} escena(s) en total en esos proyectos.`,
    );
  }

  if (p.contextLevel === 'dashboard') {
    lines.push(
      'Alcance (dashboard/organización): no inventes ni enumeres personajes o fondos concretos. Las ideas creativas, si el usuario las pide, plantéalas a nivel de proyecto o campaña, no como ideas de un vídeo concreto hasta que abra un vídeo.',
    );
  }

  if (p.contextLevel === 'video' && p.videoId) {
    lines.push(
      'Alcance (vídeo): puedes proponer ideas y mejoras para este vídeo; usa escenas y recursos del proyecto cuando el resumen lo incluya.',
    );
  }

  if (p.activeUserApiKeyCount != null) {
    lines.push(
      p.activeUserApiKeyCount > 0
        ? `Claves API propias (BYOK) activas: ${p.activeUserApiKeyCount}.`
        : 'Claves API propias (BYOK) activas: 0 (sin BYOK configurado para este usuario).',
    );
  }

  const pc = p.profileCreative;
  const types = pc?.creative_video_types?.trim();
  const platforms = pc?.creative_platforms?.trim();
  const useCtx = pc?.creative_use_context?.trim();
  const purpose = pc?.creative_purpose?.trim();
  const duration = pc?.creative_typical_duration?.trim();
  if (types || platforms || useCtx || purpose || duration) {
    lines.push('Perfil creativo del usuario (ajustes en Cuenta → Perfil):');
    if (types) lines.push(`- Tipos de vídeos que suele hacer: ${types}`);
    if (platforms) lines.push(`- Plataformas o formatos (TikTok, YouTube, Meta, presentaciones, etc.): ${platforms}`);
    if (useCtx) lines.push(`- Contexto de uso (empresa, cliente, marca personal, hobby, profesional…): ${useCtx}`);
    if (purpose) lines.push(`- Para qué / audiencia u objetivo: ${purpose}`);
    if (duration) lines.push(`- Duración habitual de sus piezas: ${duration}`);
    lines.push('Usa esto para alinear ideas, tono y plataforma; no contradigas explícitamente estas preferencias salvo que el usuario pida lo contrario.');
  }

  lines.push(
    'Instrucción: usa estos datos; no pidas "qué proyecto" si ya hay project_id salvo que el usuario pida otro. Si falta un ID para ejecutar algo, ofrece opciones concretas (nombres reales), no asumas.',
  );

  return lines.join('\n');
}
