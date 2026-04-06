-- Remove deprecated organization workspace model.
-- The application is now personal-first: projects and AI context belong directly to the user.

UPDATE public.projects
SET organization_id = NULL
WHERE organization_id IS NOT NULL;

UPDATE public.ai_conversations
SET context_org_id = NULL
WHERE context_org_id IS NOT NULL;

DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_org();

DROP POLICY IF EXISTS "org_members_select" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_select_own" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert_self" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_insert_admin" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_update" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete" ON public.organization_members;
DROP POLICY IF EXISTS "org_members_delete_admin" ON public.organization_members;

DROP POLICY IF EXISTS "orgs_select" ON public.organizations;
DROP POLICY IF EXISTS "orgs_select_member" ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert" ON public.organizations;
DROP POLICY IF EXISTS "orgs_insert_auth" ON public.organizations;
DROP POLICY IF EXISTS "orgs_update" ON public.organizations;
DROP POLICY IF EXISTS "orgs_update_owner" ON public.organizations;
DROP POLICY IF EXISTS "orgs_delete" ON public.organizations;
DROP POLICY IF EXISTS "orgs_delete_owner" ON public.organizations;

ALTER TABLE public.ai_conversations
DROP CONSTRAINT IF EXISTS ai_conversations_context_org_id_fkey;

ALTER TABLE public.projects
DROP CONSTRAINT IF EXISTS projects_organization_id_fkey;

ALTER TABLE public.ai_conversations
DROP COLUMN IF EXISTS context_org_id;

ALTER TABLE public.projects
DROP COLUMN IF EXISTS organization_id;

DROP TABLE IF EXISTS public.organization_members;
DROP TABLE IF EXISTS public.organizations;

DROP TYPE IF EXISTS public.org_role;
DROP TYPE IF EXISTS public.org_type;
