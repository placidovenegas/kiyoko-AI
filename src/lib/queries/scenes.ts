import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';

type Client = SupabaseClient<Database>;

export async function fetchSceneDetail(supabase: Client, sceneShortId: string) {
  const { data: scene, error: sceneErr } = await supabase
    .from('scenes')
    .select('*')
    .eq('short_id', sceneShortId)
    .single();

  if (sceneErr) throw sceneErr;

  const [camera, media, clips, prompts, sceneChars, sceneBgs] = await Promise.all([
    supabase.from('scene_camera').select('*').eq('scene_id', scene.id).maybeSingle(),
    supabase.from('scene_media').select('*').eq('scene_id', scene.id).order('created_at', { ascending: false }),
    supabase.from('scene_video_clips').select('*').eq('scene_id', scene.id).eq('is_current', true).order('extension_number'),
    supabase.from('scene_prompts').select('*').eq('scene_id', scene.id).order('created_at', { ascending: false }),
    supabase.from('scene_characters').select('*, characters:character_id(*)').eq('scene_id', scene.id).order('sort_order'),
    supabase.from('scene_backgrounds').select('*, backgrounds:background_id(*)').eq('scene_id', scene.id),
  ]);

  return {
    scene,
    camera: camera.data,
    media: media.data ?? [],
    clips: clips.data ?? [],
    prompts: prompts.data ?? [],
    characters: sceneChars.data ?? [],
    backgrounds: sceneBgs.data ?? [],
  };
}
