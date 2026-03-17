import { createClient } from '@/lib/supabase/server';

export async function generateJsonExport(projectId: string): Promise<string> {
  const supabase = await createClient();

  const [project, scenes, characters, backgrounds, arcs, timeline, issues] =
    await Promise.all([
      supabase.from('projects').select('*').eq('id', projectId).single(),
      supabase.from('scenes').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('characters').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('backgrounds').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('narrative_arcs').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('timeline_entries').select('*').eq('project_id', projectId).order('sort_order'),
      supabase.from('project_issues').select('*').eq('project_id', projectId).order('sort_order'),
    ]);

  const exportData = {
    version: '1.0',
    exported_at: new Date().toISOString(),
    project: project.data,
    scenes: scenes.data || [],
    characters: characters.data || [],
    backgrounds: backgrounds.data || [],
    narrative_arcs: arcs.data || [],
    timeline: timeline.data || [],
    issues: issues.data || [],
  };

  return JSON.stringify(exportData, null, 2);
}
