import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

export async function fetchVideosByProject(supabase: Client, projectId: string) {
  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .eq('project_id', projectId)
    .order('sort_order');

  if (error) throw error;
  return data;
}

export async function fetchWorkspaceVideos(supabase: Client, projectIds: string[]) {
  if (projectIds.length === 0) return [];

  const { data, error } = await supabase
    .from('videos')
    .select('*')
    .in('project_id', projectIds)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function fetchVideoWithScenes(supabase: Client, videoShortId: string) {
  const { data: video, error: vError } = await supabase
    .from('videos')
    .select('*')
    .eq('short_id', videoShortId)
    .single();

  if (vError) throw vError;

  const { data: scenes, error: sError } = await supabase
    .from('scenes')
    .select(`
      *,
      scene_camera(*),
      scene_characters(*, characters:character_id(*)),
      scene_backgrounds(*, backgrounds:background_id(*))
    `)
    .eq('video_id', video.id)
    .order('sort_order');

  if (sError) throw sError;

  return { video, scenes: scenes ?? [] };
}

export async function fetchVideoAnalysis(supabase: Client, videoId: string) {
  const { data, error } = await supabase
    .from('video_analysis')
    .select('*')
    .eq('video_id', videoId)
    .eq('is_current', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function fetchVideoNarration(supabase: Client, videoId: string) {
  const { data, error } = await supabase
    .from('video_narrations')
    .select('*')
    .eq('video_id', videoId)
    .eq('is_current', true)
    .maybeSingle();

  if (error) throw error;
  return data;
}
