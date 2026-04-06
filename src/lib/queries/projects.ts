import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

export async function fetchProjects(supabase: Client, ownerId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', ownerId)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchWorkspaceProjects(supabase: Client) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function fetchProjectByShortId(supabase: Client, shortId: string) {
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('short_id', shortId)
    .single();

  if (error) throw error;
  return data;
}

export async function fetchProjectResources(supabase: Client, projectId: string) {
  const [characters, backgrounds, stylePresets] = await Promise.all([
    supabase.from('characters').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('backgrounds').select('*').eq('project_id', projectId).order('sort_order'),
    supabase.from('style_presets').select('*').eq('project_id', projectId).order('sort_order'),
  ]);

  return {
    characters: characters.data ?? [],
    backgrounds: backgrounds.data ?? [],
    stylePresets: stylePresets.data ?? [],
  };
}
