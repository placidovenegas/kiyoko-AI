import { createClient } from '@/lib/supabase/client';

/** Campos de perfil para enriquecer el contexto de la IA (preferencias creativas). */
export interface ProfileCreativeContextLite {
  creative_video_types: string | null;
  creative_platforms: string | null;
  creative_use_context: string | null;
  creative_purpose: string | null;
  creative_typical_duration: string | null;
}

export async function fetchProfileCreativeContext(): Promise<ProfileCreativeContextLite | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select(
      'creative_video_types, creative_platforms, creative_use_context, creative_purpose, creative_typical_duration',
    )
    .eq('id', user.id)
    .maybeSingle();

  if (error || !data) return null;
  return {
    creative_video_types: (data.creative_video_types as string | null) ?? null,
    creative_platforms: (data.creative_platforms as string | null) ?? null,
    creative_use_context: (data.creative_use_context as string | null) ?? null,
    creative_purpose: (data.creative_purpose as string | null) ?? null,
    creative_typical_duration: (data.creative_typical_duration as string | null) ?? null,
  };
}
