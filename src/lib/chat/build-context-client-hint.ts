import type { ContextLevel } from '@/types/ai-context';
import type { DashboardContextStatsLite } from '@/lib/chat/fetch-dashboard-context-stats';
import type { ProfileCreativeContextLite } from '@/lib/chat/fetch-profile-creative-context';
import type { ProjectContextStatsLite } from '@/lib/chat/fetch-project-context-stats';

export interface SceneContextDetail {
  description?: string | null;
  dialogue?: string | null;
  directorNotes?: string | null;
  cameraAngle?: string | null;
  cameraMovement?: string | null;
  lighting?: string | null;
  mood?: string | null;
  audioConfig?: Record<string, boolean> | null;
  imagePrompt?: string | null;
  videoPrompt?: string | null;
  assignedCharacters?: string[];
  assignedBackground?: string | null;
  durationSeconds?: number | null;
  arcPhase?: string | null;
}

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
  /** Datos completos de la escena activa (cuando nivel = scene) */
  sceneDetail?: SceneContextDetail | null;
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

  // Scene-level detail (when viewing a specific scene)
  if (p.contextLevel === 'scene' && p.sceneDetail) {
    const sd = p.sceneDetail;
    lines.push('--- DETALLE DE LA ESCENA ACTIVA ---');
    if (sd.description) lines.push(`Descripción: ${sd.description}`);
    if (sd.durationSeconds) lines.push(`Duración: ${sd.durationSeconds}s`);
    if (sd.arcPhase) lines.push(`Fase: ${sd.arcPhase}`);
    if (sd.cameraAngle || sd.cameraMovement) lines.push(`Cámara: ${sd.cameraAngle ?? 'auto'} · ${sd.cameraMovement ?? 'auto'}`);
    if (sd.lighting) lines.push(`Iluminación: ${sd.lighting}`);
    if (sd.mood) lines.push(`Mood: ${sd.mood}`);
    if (sd.audioConfig) {
      const audio = Object.entries(sd.audioConfig).filter(([, v]) => v).map(([k]) => k).join(', ');
      lines.push(`Audio: ${audio || 'sin configurar'}`);
    }
    if (sd.assignedCharacters?.length) lines.push(`Personajes: ${sd.assignedCharacters.join(', ')}`);
    if (sd.assignedBackground) lines.push(`Fondo: ${sd.assignedBackground}`);
    if (sd.dialogue) lines.push(`Diálogo: "${sd.dialogue}"`);
    if (sd.directorNotes) lines.push(`Notas director: ${sd.directorNotes}`);
    if (sd.imagePrompt) lines.push(`Prompt imagen actual: ${sd.imagePrompt.slice(0, 200)}...`);
    if (sd.videoPrompt) lines.push(`Prompt video actual: ${sd.videoPrompt.slice(0, 200)}...`);
    lines.push('--- FIN DETALLE ESCENA ---');
    lines.push('Tienes acceso completo a los datos de esta escena. Puedes sugerir cambios de cámara, mejorar prompts, extender la escena, o modificar cualquier campo. Usa [ACTION_PLAN] para cambios y [PROMPT_PREVIEW] para mostrar prompts nuevos.');
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
