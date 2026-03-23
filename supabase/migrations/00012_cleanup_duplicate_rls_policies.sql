-- =============================================
-- Cleanup duplicate/recursive RLS policies
-- Migration: 00012_cleanup_duplicate_rls_policies.sql
--
-- Problem: Both migrations 00008/00009 and manual SQL created
-- overlapping policies on organizations and organization_members.
-- The org_members_select policy is recursive (references its own table
-- in a subquery within the same policy evaluation).
-- =============================================

-- =============================================
-- ORGANIZATION_MEMBERS: Drop duplicate policies
-- =============================================

-- Drop the recursive SELECT policy (references organization_members from within itself)
-- Keep: org_members_select_own (simple user_id = auth.uid() check)
DROP POLICY IF EXISTS "org_members_select" ON organization_members;

-- Drop the combined INSERT policy (duplicates org_members_insert_self + admin logic)
-- Keep: org_members_insert_self (user_id = auth.uid())
-- Re-create org_members_insert_admin if missing (from migration 00009)
DROP POLICY IF EXISTS "org_members_insert" ON organization_members;

-- Drop the duplicate DELETE policy (identical to org_members_delete_admin)
-- Keep: org_members_delete_admin
DROP POLICY IF EXISTS "org_members_delete" ON organization_members;

-- =============================================
-- Ensure org_members_insert_admin exists
-- (migration 00009 defined it but it is missing from the live DB)
-- =============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'organization_members'
      AND policyname = 'org_members_insert_admin'
  ) THEN
    EXECUTE $policy$
      CREATE POLICY "org_members_insert_admin" ON organization_members
      FOR INSERT WITH CHECK (
        organization_id IN (
          SELECT organization_id FROM organization_members
          WHERE user_id = (select auth.uid()) AND role IN ('owner', 'admin')
        )
      )
    $policy$;
  END IF;
END $$;

-- =============================================
-- ORGANIZATIONS: Drop duplicate policies
-- =============================================

-- Drop the duplicate SELECT policy
-- Keep: orgs_select_member (checks membership via organization_members)
DROP POLICY IF EXISTS "orgs_select" ON organizations;

-- Drop the duplicate INSERT policy
-- Keep: orgs_insert_auth (auth.uid() IS NOT NULL)
DROP POLICY IF EXISTS "orgs_insert" ON organizations;

-- Drop the duplicate UPDATE policy
-- Keep: orgs_update_owner (checks owner role via organization_members)
DROP POLICY IF EXISTS "orgs_update" ON organizations;

-- =============================================
-- Expected final state:
-- =============================================
-- organization_members:
--   org_members_select_own   (SELECT) - user_id = auth.uid()
--   org_members_insert_self  (INSERT) - user_id = auth.uid()
--   org_members_insert_admin (INSERT) - org admins/owners can add members
--   org_members_update       (UPDATE) - org admins/owners can update
--   org_members_delete_admin (DELETE) - org admins/owners can delete
--
-- organizations:
--   orgs_select_member (SELECT) - members can view
--   orgs_insert_auth   (INSERT) - authenticated users can create
--   orgs_update_owner  (UPDATE) - owners can update
--   orgs_delete_owner  (DELETE) - owners can delete (except personal)
