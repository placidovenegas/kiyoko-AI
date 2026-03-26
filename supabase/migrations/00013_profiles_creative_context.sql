-- Contexto creativo del usuario para la IA (ideas alineadas al perfil)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creative_video_types text,
  ADD COLUMN IF NOT EXISTS creative_purpose text;

COMMENT ON COLUMN public.profiles.creative_video_types IS 'Tipos de vídeos que el usuario suele crear; texto libre o etiquetas separadas por comas';
COMMENT ON COLUMN public.profiles.creative_purpose IS 'Para qué o para quién crea contenido (objetivo, audiencia, marca)';
