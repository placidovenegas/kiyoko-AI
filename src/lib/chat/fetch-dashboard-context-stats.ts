import { createClient } from '@/lib/supabase/client';

/**
 * Conteos agregados del espacio de trabajo (dashboard / org), alineados con el guión de interacción:
 * números reales para desambiguación sin project_id.
 */
export interface DashboardContextStatsLite {
  projectCount: number;
  openTaskCount: number;
  totalTaskCount: number;
  videoCount: number;
  characterCount: number;
  backgroundCount: number;
  sceneCount: number;
}

/**
 * @param organizationId Si hay org activa, solo proyectos de esa org; si no, todos los visibles por RLS.
 */
export async function fetchDashboardContextStats(
  organizationId: string | null,
): Promise<DashboardContextStatsLite | null> {
  const supabase = createClient();

  let pq = supabase.from('projects').select('id');
  if (organizationId) {
    pq = pq.eq('organization_id', organizationId);
  }
  const { data: projects, error: pe } = await pq;
  if (pe) return null;

  const ids = (projects ?? []).map((p) => p.id as string);
  const projectCount = ids.length;

  if (projectCount === 0) {
    return {
      projectCount: 0,
      openTaskCount: 0,
      totalTaskCount: 0,
      videoCount: 0,
      characterCount: 0,
      backgroundCount: 0,
      sceneCount: 0,
    };
  }

  const [tOpen, tTotal, v, c, b, s] = await Promise.all([
    supabase
      .from('tasks')
      .select('id', { count: 'exact', head: true })
      .in('project_id', ids)
      .in('status', ['pending', 'in_progress']),
    supabase.from('tasks').select('id', { count: 'exact', head: true }).in('project_id', ids),
    supabase.from('videos').select('id', { count: 'exact', head: true }).in('project_id', ids),
    supabase.from('characters').select('id', { count: 'exact', head: true }).in('project_id', ids),
    supabase.from('backgrounds').select('id', { count: 'exact', head: true }).in('project_id', ids),
    supabase.from('scenes').select('id', { count: 'exact', head: true }).in('project_id', ids),
  ]);

  if (tOpen.error || tTotal.error || v.error || c.error || b.error || s.error) {
    return null;
  }

  return {
    projectCount,
    openTaskCount: tOpen.count ?? 0,
    totalTaskCount: tTotal.count ?? 0,
    videoCount: v.count ?? 0,
    characterCount: c.count ?? 0,
    backgroundCount: b.count ?? 0,
    sceneCount: s.count ?? 0,
  };
}
