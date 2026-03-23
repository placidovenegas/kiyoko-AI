-- Enable RLS on organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- Users can view orgs they belong to
CREATE POLICY "orgs_select_member" ON organizations
FOR SELECT USING (
  id IN (
    SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Authenticated users can create orgs
CREATE POLICY "orgs_insert_auth" ON organizations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Owners can update their org
CREATE POLICY "orgs_update_owner" ON organizations
FOR UPDATE USING (
  id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'owner'
  )
);

-- Owners can delete their org (except personal)
CREATE POLICY "orgs_delete_owner" ON organizations
FOR DELETE USING (
  id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role = 'owner'
  ) AND org_type != 'personal'
);
