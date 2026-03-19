-- ================================================================
-- Migration 00006: Narration, Notifications, Activity Log, Tasks
-- Date: 2026-03-19
-- ================================================================

BEGIN;

-- ================================================================
-- 1. NARRATION FIELDS ON SCENES
-- ================================================================
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS narration_text TEXT DEFAULT '';
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS narration_audio_url TEXT;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS narration_audio_duration_ms INTEGER;
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS music_suggestion TEXT DEFAULT '';
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS sfx_suggestion TEXT DEFAULT '';
ALTER TABLE public.scenes ADD COLUMN IF NOT EXISTS music_intensity INTEGER DEFAULT 5;

-- ================================================================
-- 2. NARRATION FIELDS ON PROJECTS
-- ================================================================
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS narration_mode TEXT DEFAULT 'none';
  -- 'none' | 'per_scene' | 'continuous'
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS narration_config JSONB DEFAULT '{
  "language": "es",
  "tone": "professional",
  "perspective": "third_person",
  "voice_id": null,
  "voice_provider": null
}';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS narration_full_text TEXT DEFAULT '';
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS narration_full_audio_url TEXT;

-- ================================================================
-- 3. NOTIFICATIONS TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
    -- 'task_due', 'video_scheduled', 'ai_completed', 'scene_updated', 'export_ready', 'comment_mention', 'share_invite'
  title VARCHAR(255) NOT NULL,
  body TEXT,
  link TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user
  ON public.notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_project
  ON public.notifications(project_id) WHERE project_id IS NOT NULL;

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.notifications
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "notifications_delete_own" ON public.notifications
  FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "notifications_insert_system" ON public.notifications
  FOR INSERT WITH CHECK (true);
  -- Inserts come from server/triggers, not directly from client

-- ================================================================
-- 4. ACTIVITY LOG TABLE
-- ================================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  entity_type VARCHAR(50) NOT NULL,
    -- 'scene', 'video', 'character', 'background', 'task', 'project', 'export'
  entity_id UUID,
  action VARCHAR(50) NOT NULL,
    -- 'created', 'updated', 'deleted', 'generated', 'exported', 'approved', 'rejected'
  description TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_project
  ON public.activity_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_entity
  ON public.activity_log(entity_type, entity_id) WHERE entity_id IS NOT NULL;

ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "activity_select_own" ON public.activity_log
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "activity_insert" ON public.activity_log
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ================================================================
-- 5. TASKS TABLE
-- ================================================================
DO $$ BEGIN
  CREATE TYPE task_status AS ENUM ('pending', 'in_progress', 'in_review', 'completed', 'blocked');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM ('low', 'medium', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE task_category AS ENUM ('script', 'prompt', 'image_gen', 'video_gen', 'review', 'export', 'meeting', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  video_id UUID,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status task_status NOT NULL DEFAULT 'pending',
  priority task_priority NOT NULL DEFAULT 'medium',
  category task_category NOT NULL DEFAULT 'other',
  assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  due_date DATE,
  scheduled_date DATE,
  completed_at TIMESTAMPTZ,
  sort_order INTEGER DEFAULT 0,
  created_by VARCHAR(10) DEFAULT 'manual',
    -- 'manual' | 'ai'
  ai_generated_batch UUID,
  depends_on UUID[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_project_status
  ON public.tasks(project_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_video
  ON public.tasks(video_id) WHERE video_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_scheduled
  ON public.tasks(scheduled_date) WHERE scheduled_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_due
  ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_assigned
  ON public.tasks(assigned_to) WHERE assigned_to IS NOT NULL;

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tasks_select_own" ON public.tasks
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "tasks_insert_own" ON public.tasks
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "tasks_update_own" ON public.tasks
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "tasks_delete_own" ON public.tasks
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- Auto-set completed_at when status changes to completed
CREATE OR REPLACE FUNCTION trigger_task_completed()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status != 'completed') THEN
    NEW.completed_at = NOW();
  ELSIF NEW.status != 'completed' THEN
    NEW.completed_at = NULL;
  END IF;
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS task_status_change ON public.tasks;
CREATE TRIGGER task_status_change
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW EXECUTE FUNCTION trigger_task_completed();

-- ================================================================
-- 6. COMMENTS TABLE (for collaboration)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  scene_id UUID REFERENCES public.scenes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  resolved BOOLEAN DEFAULT false,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_scene
  ON public.comments(scene_id, created_at) WHERE scene_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comments_project
  ON public.comments(project_id, created_at DESC);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comments_select_own" ON public.comments
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "comments_insert_own" ON public.comments
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_update_own" ON public.comments
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "comments_delete_own" ON public.comments
  FOR DELETE USING (user_id = auth.uid());

-- ================================================================
-- 7. PROJECT SHARES TABLE (for collaboration)
-- ================================================================
CREATE TABLE IF NOT EXISTS public.project_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  shared_by UUID NOT NULL REFERENCES public.profiles(id),
  shared_with_email VARCHAR(255),
  shared_with_user UUID REFERENCES public.profiles(id),
  role VARCHAR(20) NOT NULL DEFAULT 'viewer',
    -- 'viewer', 'editor', 'admin'
  token VARCHAR(64) UNIQUE,
  is_public_link BOOLEAN DEFAULT false,
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_shares_project
  ON public.project_shares(project_id);
CREATE INDEX IF NOT EXISTS idx_shares_user
  ON public.project_shares(shared_with_user) WHERE shared_with_user IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_shares_token
  ON public.project_shares(token) WHERE token IS NOT NULL;

ALTER TABLE public.project_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shares_select_own" ON public.project_shares
  FOR SELECT USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
    OR shared_with_user = auth.uid()
  );
CREATE POLICY "shares_insert_own" ON public.project_shares
  FOR INSERT WITH CHECK (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "shares_update_own" ON public.project_shares
  FOR UPDATE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );
CREATE POLICY "shares_delete_own" ON public.project_shares
  FOR DELETE USING (
    project_id IN (SELECT id FROM public.projects WHERE owner_id = auth.uid())
  );

-- ================================================================
-- 8. USER PLANS & BILLING TABLES
-- ================================================================
CREATE TABLE IF NOT EXISTS public.user_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  plan VARCHAR(20) NOT NULL DEFAULT 'free',
    -- 'free', 'pro', 'business', 'enterprise'
  stripe_customer_id VARCHAR(255),
  stripe_subscription_id VARCHAR(255),
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.user_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "plans_select_own" ON public.user_plans
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "plans_update_own" ON public.user_plans
  FOR UPDATE USING (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  period_start DATE NOT NULL,
  ai_text_messages INTEGER DEFAULT 0,
  ai_images_generated INTEGER DEFAULT 0,
  ai_videos_generated INTEGER DEFAULT 0,
  tts_characters INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,
  projects_count INTEGER DEFAULT 0,
  UNIQUE(user_id, period_start)
);

CREATE INDEX IF NOT EXISTS idx_usage_user_period
  ON public.usage_tracking(user_id, period_start);

ALTER TABLE public.usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usage_select_own" ON public.usage_tracking
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "usage_upsert" ON public.usage_tracking
  FOR INSERT WITH CHECK (true);
CREATE POLICY "usage_update" ON public.usage_tracking
  FOR UPDATE USING (true);

CREATE TABLE IF NOT EXISTS public.billing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_type VARCHAR(50) NOT NULL,
    -- 'subscription_created', 'payment_succeeded', 'payment_failed', 'plan_changed', 'usage_limit_reached'
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'EUR',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.billing_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_select_own" ON public.billing_events
  FOR SELECT USING (user_id = auth.uid());

-- ================================================================
-- 9. EDITOR STATE ON VIDEOS (for video editor)
-- ================================================================
-- Note: videos table may not exist yet if multi-video migration hasn't run.
-- These columns will be added when the multi-video migration runs.
-- For now, add editor columns to projects as fallback.
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS editor_state JSONB DEFAULT '{}';

COMMIT;
