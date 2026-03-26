-- Plataformas, contexto de uso (empresa/personal) y duración típica para mejor contexto de IA
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS creative_platforms text,
  ADD COLUMN IF NOT EXISTS creative_use_context text,
  ADD COLUMN IF NOT EXISTS creative_typical_duration text;

COMMENT ON COLUMN public.profiles.creative_platforms IS 'Plataformas o formatos: TikTok, YouTube, Meta, presentaciones, etc.';
COMMENT ON COLUMN public.profiles.creative_use_context IS 'Uso: empresa, cliente, marca personal, hobby, profesional...';
COMMENT ON COLUMN public.profiles.creative_typical_duration IS 'Duración habitual de los vídeos (ej. 15-60s, 2-5 min)';
