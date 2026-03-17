-- =============================================
-- Kiyoko AI — Initial Database Schema
-- Migration: 00001_initial_schema.sql
-- =============================================

-- =============================================
-- EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- For fuzzy search

-- =============================================
-- ENUM TYPES
-- =============================================
CREATE TYPE user_role AS ENUM ('admin', 'editor', 'viewer', 'pending', 'blocked');
CREATE TYPE project_status AS ENUM ('draft', 'in_progress', 'review', 'completed', 'archived');
CREATE TYPE project_style AS ENUM ('pixar', 'realistic', 'anime', 'watercolor', 'flat_2d', 'cyberpunk', 'custom');
CREATE TYPE target_platform AS ENUM ('youtube', 'instagram_reels', 'tiktok', 'tv_commercial', 'web', 'custom');
CREATE TYPE scene_type AS ENUM ('original', 'improved', 'new', 'filler', 'video');
CREATE TYPE scene_status AS ENUM ('draft', 'prompt_ready', 'generating', 'generated', 'approved', 'rejected');
CREATE TYPE arc_phase AS ENUM ('hook', 'build', 'peak', 'close');
CREATE TYPE issue_type AS ENUM ('strength', 'warning', 'suggestion');
CREATE TYPE export_format AS ENUM ('html', 'json', 'markdown', 'pdf');
CREATE TYPE camera_angle AS ENUM ('wide', 'medium', 'close_up', 'extreme_close_up', 'pov', 'low_angle', 'high_angle', 'birds_eye', 'dutch', 'over_shoulder');
CREATE TYPE camera_movement AS ENUM ('static', 'dolly_in', 'dolly_out', 'pan_left', 'pan_right', 'tilt_up', 'tilt_down', 'tracking', 'crane', 'handheld', 'orbit');

-- =============================================
-- 1. PROFILES (extends auth.users)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT DEFAULT '',
  avatar_url TEXT,
  role user_role NOT NULL DEFAULT 'pending',
  bio TEXT DEFAULT '',
  company TEXT DEFAULT '',
  preferences JSONB DEFAULT '{
    "theme": "system",
    "language": "es",
    "notifications": true,
    "default_style": "pixar"
  }',
  last_active_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 2. PROJECTS
-- =============================================
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  client_name TEXT DEFAULT '',
  client_logo_url TEXT,
  style project_style NOT NULL DEFAULT 'pixar',
  custom_style_description TEXT,
  status project_status NOT NULL DEFAULT 'draft',
  target_duration_seconds INTEGER DEFAULT 60,
  target_platform target_platform NOT NULL DEFAULT 'youtube',

  -- Project color palette (for exports and UI)
  color_palette JSONB DEFAULT '{
    "primary": "#C8860A",
    "secondary": "#E8943A",
    "accent": "#F5EDD8",
    "dark": "#2A1A0A",
    "light": "#FFF8EB"
  }',

  -- Original brief given to AI
  ai_brief TEXT DEFAULT '',

  -- Full AI-generated analysis (snapshot)
  ai_analysis JSONB DEFAULT '{}',

  -- Image generator configuration
  image_generator TEXT DEFAULT 'grok_aurora',
  image_generator_config JSONB DEFAULT '{}',

  -- Video generator configuration
  video_generator TEXT DEFAULT 'grok_aurora',
  video_generator_config JSONB DEFAULT '{}',

  -- Extra metadata
  tags TEXT[] DEFAULT '{}',
  is_demo BOOLEAN DEFAULT FALSE,
  thumbnail_url TEXT,
  cover_image_url TEXT,

  -- Computed stats
  total_scenes INTEGER DEFAULT 0,
  total_characters INTEGER DEFAULT 0,
  total_backgrounds INTEGER DEFAULT 0,
  estimated_duration_seconds NUMERIC(6,1) DEFAULT 0,
  completion_percentage INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_owner ON public.projects(owner_id);
CREATE INDEX idx_projects_slug ON public.projects(slug);
CREATE INDEX idx_projects_status ON public.projects(status);

-- =============================================
-- 3. CHARACTERS
-- =============================================
CREATE TABLE public.characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  name TEXT NOT NULL,
  initials TEXT NOT NULL DEFAULT '',
  role TEXT DEFAULT '',
  description TEXT DEFAULT '',

  -- Detailed visual description (for AI prompt generation)
  visual_description TEXT DEFAULT '',

  -- Reusable snippet injected into scene prompts
  prompt_snippet TEXT DEFAULT '',

  personality TEXT DEFAULT '',

  -- Constant visual attributes
  signature_clothing TEXT DEFAULT '',
  hair_description TEXT DEFAULT '',
  accessories TEXT[] DEFAULT '{}',
  signature_tools TEXT[] DEFAULT '{}',

  -- Character accent color (for badges and UI)
  color_accent TEXT DEFAULT '#6B7280',

  -- Reference image (character sheet uploaded to Storage)
  reference_image_url TEXT,
  reference_image_path TEXT,

  -- Scenes this character appears in (computed)
  appears_in_scenes TEXT[] DEFAULT '{}',

  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_characters_project ON public.characters(project_id);

-- =============================================
-- 4. BACKGROUNDS (Locations)
-- =============================================
CREATE TABLE public.backgrounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',

  -- Location type
  location_type TEXT DEFAULT 'interior',
  time_of_day TEXT DEFAULT 'day',

  -- Prompt snippet injected into scenes using this background
  prompt_snippet TEXT DEFAULT '',

  -- Reference image
  reference_image_url TEXT,
  reference_image_path TEXT,

  -- Available angles for this background
  available_angles TEXT[] DEFAULT '{}',

  -- Scenes using this background (computed)
  used_in_scenes TEXT[] DEFAULT '{}',

  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_backgrounds_project ON public.backgrounds(project_id);

-- =============================================
-- 5. SCENES (Main table)
-- =============================================
CREATE TABLE public.scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Identification
  scene_number TEXT NOT NULL,
  title TEXT NOT NULL,

  -- Classification
  scene_type scene_type NOT NULL DEFAULT 'original',
  category TEXT DEFAULT '',
  arc_phase arc_phase DEFAULT 'build',

  -- Narrative content
  description TEXT DEFAULT '',
  director_notes TEXT DEFAULT '',

  -- PROMPTS (the most important content)
  prompt_image TEXT DEFAULT '',
  prompt_video TEXT DEFAULT '',
  prompt_additions TEXT DEFAULT '',

  -- Improvements
  improvements JSONB DEFAULT '[]',

  -- Timing
  duration_seconds NUMERIC(4,1) DEFAULT 5.0,
  start_time TEXT DEFAULT '',
  end_time TEXT DEFAULT '',

  -- References
  background_id UUID REFERENCES public.backgrounds(id) ON DELETE SET NULL,
  character_ids UUID[] DEFAULT '{}',

  -- Reference images needed to generate this scene
  required_references TEXT[] DEFAULT '{}',
  reference_tip TEXT DEFAULT '',

  -- Camera
  camera_angle camera_angle DEFAULT 'medium',
  camera_movement camera_movement DEFAULT 'static',
  camera_notes TEXT DEFAULT '',

  -- Atmosphere
  lighting TEXT DEFAULT '',
  mood TEXT DEFAULT '',
  music_notes TEXT DEFAULT '',
  sound_notes TEXT DEFAULT '',

  -- Production status
  status scene_status NOT NULL DEFAULT 'draft',

  -- Generated images (Storage URLs)
  generated_image_url TEXT,
  generated_image_path TEXT,
  generated_image_thumbnail_url TEXT,
  generated_video_url TEXT,
  generated_video_path TEXT,

  -- Previous versions
  prompt_history JSONB DEFAULT '[]',

  -- Visual order
  sort_order INTEGER DEFAULT 0,

  -- Free-form notes
  notes TEXT DEFAULT '',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_scenes_project ON public.scenes(project_id);
CREATE INDEX idx_scenes_type ON public.scenes(scene_type);
CREATE INDEX idx_scenes_sort ON public.scenes(project_id, sort_order);

-- =============================================
-- 6. NARRATIVE_ARCS (Narrative arc phases)
-- =============================================
CREATE TABLE public.narrative_arcs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  phase TEXT NOT NULL,
  phase_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',

  start_second NUMERIC(5,1) DEFAULT 0,
  end_second NUMERIC(5,1) DEFAULT 0,

  scene_ids UUID[] DEFAULT '{}',
  scene_numbers TEXT[] DEFAULT '{}',

  color TEXT DEFAULT '#6B7280',
  icon TEXT DEFAULT '',

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_arcs_project ON public.narrative_arcs(project_id);

-- =============================================
-- 7. TIMELINE_ENTRIES (Final edit second-by-second)
-- =============================================
CREATE TABLE public.timeline_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,

  title TEXT NOT NULL,
  description TEXT DEFAULT '',

  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  duration_seconds NUMERIC(4,1) DEFAULT 0,

  arc_phase arc_phase DEFAULT 'build',
  phase_color TEXT DEFAULT '#6B7280',

  -- For alternative versions (long cut vs Instagram cut)
  timeline_version TEXT DEFAULT 'full',

  sort_order INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_timeline_project ON public.timeline_entries(project_id);

-- =============================================
-- 8. PROJECT_ISSUES (Diagnosis / Analysis)
-- =============================================
CREATE TABLE public.project_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  issue_type issue_type NOT NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',

  category TEXT DEFAULT '',
  priority INTEGER DEFAULT 0,
  resolved BOOLEAN DEFAULT FALSE,
  resolution_notes TEXT DEFAULT '',

  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_issues_project ON public.project_issues(project_id);

-- =============================================
-- 9. AI_CONVERSATIONS (AI chat per project)
-- =============================================
CREATE TABLE public.ai_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  -- Message history
  messages JSONB NOT NULL DEFAULT '[]',

  -- Wizard step (if creation conversation)
  wizard_step TEXT DEFAULT '',

  -- Conversation type
  conversation_type TEXT DEFAULT 'wizard',

  title TEXT DEFAULT 'Nueva conversacion',
  completed BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_conversations_project ON public.ai_conversations(project_id);

-- =============================================
-- 10. EXPORTS (Export history)
-- =============================================
CREATE TABLE public.exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,

  format export_format NOT NULL,
  file_url TEXT,
  file_path TEXT,
  file_size_bytes INTEGER DEFAULT 0,

  version INTEGER DEFAULT 1,
  notes TEXT DEFAULT '',

  -- Config used to generate
  config JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- 11. REFERENCE_MAPS (Which image to upload per scene)
-- =============================================
CREATE TABLE public.reference_maps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID NOT NULL REFERENCES public.scenes(id) ON DELETE CASCADE,
  background_id UUID REFERENCES public.backgrounds(id) ON DELETE SET NULL,
  character_id UUID REFERENCES public.characters(id) ON DELETE SET NULL,

  reference_type TEXT NOT NULL,
  priority INTEGER DEFAULT 0,
  notes TEXT DEFAULT '',

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refmap_scene ON public.reference_maps(scene_id);

-- =============================================
-- 12. USER_API_KEYS (Encrypted user API keys)
-- =============================================
CREATE TABLE public.user_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,

  provider TEXT NOT NULL,
  api_key_encrypted TEXT NOT NULL,
  api_key_hint TEXT NOT NULL,

  is_active BOOLEAN DEFAULT TRUE,

  -- Usage tracking
  total_requests INTEGER DEFAULT 0,
  total_tokens_used BIGINT DEFAULT 0,
  total_cost_usd NUMERIC(10,4) DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  last_error TEXT,
  last_error_at TIMESTAMPTZ,

  -- User-customized limits
  monthly_budget_usd NUMERIC(10,2),
  monthly_spent_usd NUMERIC(10,4) DEFAULT 0,
  budget_reset_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

CREATE INDEX idx_api_keys_user ON public.user_api_keys(user_id);

-- =============================================
-- 13. AI_USAGE_LOGS (AI usage tracking and fallback)
-- =============================================
CREATE TABLE public.ai_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,

  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  task TEXT NOT NULL,

  input_tokens INTEGER DEFAULT 0,
  output_tokens INTEGER DEFAULT 0,
  total_tokens INTEGER DEFAULT 0,

  estimated_cost_usd NUMERIC(10,6) DEFAULT 0,

  -- Fallback info
  was_fallback BOOLEAN DEFAULT FALSE,
  original_provider TEXT,
  fallback_reason TEXT,

  response_time_ms INTEGER DEFAULT 0,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_usage_user ON public.ai_usage_logs(user_id);
CREATE INDEX idx_usage_created ON public.ai_usage_logs(created_at);

-- =============================================
-- TRIGGERS
-- =============================================

-- Auto-create profile on user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  admin_email TEXT;
BEGIN
  -- Read admin email from app settings or hardcoded variable
  admin_email := coalesce(
    current_setting('app.settings.admin_email', true),
    'admin@kiyoko.ai'
  );

  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    CASE WHEN NEW.email = admin_email THEN 'admin'::user_role ELSE 'pending'::user_role END
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Auto-update updated_at on all tables with that column
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.characters FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.backgrounds FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.scenes FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.project_issues FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.ai_conversations FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.user_api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Function to recalculate project stats
CREATE OR REPLACE FUNCTION public.recalc_project_stats(p_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.projects SET
    total_scenes = (SELECT COUNT(*) FROM public.scenes WHERE project_id = p_id),
    total_characters = (SELECT COUNT(*) FROM public.characters WHERE project_id = p_id),
    total_backgrounds = (SELECT COUNT(*) FROM public.backgrounds WHERE project_id = p_id),
    estimated_duration_seconds = (SELECT COALESCE(SUM(duration_seconds), 0) FROM public.scenes WHERE project_id = p_id),
    completion_percentage = (
      SELECT CASE WHEN COUNT(*) = 0 THEN 0
      ELSE ROUND((COUNT(*) FILTER (WHERE status IN ('generated', 'approved'))::NUMERIC / COUNT(*)::NUMERIC) * 100)
      END FROM public.scenes WHERE project_id = p_id
    )
  WHERE id = p_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================
-- VIEW: Monthly AI usage summary per user
-- =============================================
CREATE OR REPLACE VIEW public.ai_usage_monthly AS
SELECT
  user_id,
  provider,
  date_trunc('month', created_at) AS month,
  COUNT(*) AS total_requests,
  SUM(total_tokens) AS total_tokens,
  SUM(estimated_cost_usd) AS total_cost,
  COUNT(*) FILTER (WHERE was_fallback) AS fallback_count,
  COUNT(*) FILTER (WHERE NOT success) AS error_count
FROM public.ai_usage_logs
GROUP BY user_id, provider, date_trunc('month', created_at);
