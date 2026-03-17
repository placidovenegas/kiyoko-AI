-- =============================================
-- Kiyoko AI — Row Level Security Policies
-- Migration: 00002_rls_policies.sql
-- =============================================

-- =============================================
-- ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.narrative_arcs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reference_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Check if current user is approved (admin, editor, or viewer)
CREATE OR REPLACE FUNCTION public.is_approved()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor', 'viewer')
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- =============================================
-- POLICIES: PROFILES
-- =============================================
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admin reads all profiles"
  ON public.profiles FOR SELECT
  USING (is_admin());

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admin updates any profile"
  ON public.profiles FOR UPDATE
  USING (is_admin());

-- =============================================
-- POLICIES: PROJECTS
-- =============================================
CREATE POLICY "Admin full access projects"
  ON public.projects FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access projects"
  ON public.projects FOR ALL
  USING (owner_id = auth.uid() AND is_approved());

CREATE POLICY "Anyone reads demo projects"
  ON public.projects FOR SELECT
  USING (is_demo = TRUE AND is_approved());

-- =============================================
-- POLICIES: CHARACTERS
-- =============================================
CREATE POLICY "Admin full access characters"
  ON public.characters FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access characters"
  ON public.characters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = characters.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo characters readable"
  ON public.characters FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = characters.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: BACKGROUNDS
-- =============================================
CREATE POLICY "Admin full access backgrounds"
  ON public.backgrounds FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access backgrounds"
  ON public.backgrounds FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = backgrounds.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo backgrounds readable"
  ON public.backgrounds FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = backgrounds.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: SCENES
-- =============================================
CREATE POLICY "Admin full access scenes"
  ON public.scenes FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access scenes"
  ON public.scenes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = scenes.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo scenes readable"
  ON public.scenes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = scenes.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: NARRATIVE_ARCS
-- =============================================
CREATE POLICY "Admin full access narrative_arcs"
  ON public.narrative_arcs FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access narrative_arcs"
  ON public.narrative_arcs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = narrative_arcs.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo narrative_arcs readable"
  ON public.narrative_arcs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = narrative_arcs.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: TIMELINE_ENTRIES
-- =============================================
CREATE POLICY "Admin full access timeline_entries"
  ON public.timeline_entries FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access timeline_entries"
  ON public.timeline_entries FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = timeline_entries.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo timeline_entries readable"
  ON public.timeline_entries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = timeline_entries.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: PROJECT_ISSUES
-- =============================================
CREATE POLICY "Admin full access project_issues"
  ON public.project_issues FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access project_issues"
  ON public.project_issues FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_issues.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo project_issues readable"
  ON public.project_issues FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = project_issues.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: AI_CONVERSATIONS
-- =============================================
CREATE POLICY "Admin full access ai_conversations"
  ON public.ai_conversations FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access ai_conversations"
  ON public.ai_conversations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = ai_conversations.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo ai_conversations readable"
  ON public.ai_conversations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = ai_conversations.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: EXPORTS
-- =============================================
CREATE POLICY "Admin full access exports"
  ON public.exports FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access exports"
  ON public.exports FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = exports.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo exports readable"
  ON public.exports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = exports.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: REFERENCE_MAPS
-- =============================================
CREATE POLICY "Admin full access reference_maps"
  ON public.reference_maps FOR ALL
  USING (is_admin());

CREATE POLICY "Owner full access reference_maps"
  ON public.reference_maps FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = reference_maps.project_id AND owner_id = auth.uid()
    )
    AND is_approved()
  );

CREATE POLICY "Demo reference_maps readable"
  ON public.reference_maps FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE id = reference_maps.project_id AND is_demo = TRUE
    )
    AND is_approved()
  );

-- =============================================
-- POLICIES: USER_API_KEYS
-- =============================================
CREATE POLICY "Users manage own keys"
  ON public.user_api_keys FOR ALL
  USING (user_id = auth.uid());

CREATE POLICY "Admin reads all keys"
  ON public.user_api_keys FOR SELECT
  USING (is_admin());

-- =============================================
-- POLICIES: AI_USAGE_LOGS
-- =============================================
CREATE POLICY "Users read own logs"
  ON public.ai_usage_logs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin full access logs"
  ON public.ai_usage_logs FOR ALL
  USING (is_admin());
