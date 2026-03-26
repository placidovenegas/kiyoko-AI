import { createClient } from '@/lib/supabase/client';

/** Conteos ligeros para contexto de IA / UI (solo lectura, RLS del usuario). */
export interface ProjectContextStatsLite {
  videoCount: number;
  characterCount: number;
  backgroundCount: number;
  sceneCount: number;
  /** Tareas no completadas */
  openTaskCount: number;
  /** Todas las tareas del proyecto (incl. completadas) */
  totalTaskCount: number;
  /** Proyectos en el mismo ámbito (misma organización o mismo owner si no hay org) */
  projectsInScopeCount: number;
  /** Si hay vídeo activo: escenas de ese vídeo */
  scenesInCurrentVideo?: number;
}

/**
 * Carga conteos por proyecto; opcionalmente escenas del `videoId` actual.
 */
export async function fetchProjectContextStats(
  projectId: string,
  videoId?: string | null,
): Promise<ProjectContextStatsLite | null> {
  const supabase = createClient();

  const { data: projRow, error: projErr } = await supabase
    .from('projects')
    .select('organization_id, owner_id')
    .eq('id', projectId)
    .single();

  if (projErr || !projRow) {
    return null;
  }

  const scopeQ =
    projRow.organization_id != null
      ? supabase
          .from('projects')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', projRow.organization_id)
      : supabase.from('projects').select('id', { count: 'exact', head: true }).eq('owner_id', projRow.owner_id);

  const [v, c, b, s, tOpen, tTotal, pScope] = await Promise.all([
    supabase.from('videos').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('characters').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('backgrounds').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase.from('scenes').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .neq('status', 'completed'),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('project_id', projectId),
    scopeQ,
  ]);

  if (v.error || c.error || b.error || s.error || tOpen.error || tTotal.error || pScope.error) {
    return null;
  }

  let scenesInCurrentVideo: number | undefined;
  if (videoId) {
    const sv = await supabase
      .from('scenes')
      .select('id', { count: 'exact', head: true })
      .eq('video_id', videoId);
    if (!sv.error) scenesInCurrentVideo = sv.count ?? 0;
  }

  return {
    videoCount: v.count ?? 0,
    characterCount: c.count ?? 0,
    backgroundCount: b.count ?? 0,
    sceneCount: s.count ?? 0,
    openTaskCount: tOpen.count ?? 0,
    totalTaskCount: tTotal.count ?? 0,
    projectsInScopeCount: pScope.count ?? 0,
    scenesInCurrentVideo,
  };
}
