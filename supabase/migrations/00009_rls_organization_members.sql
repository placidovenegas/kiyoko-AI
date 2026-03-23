-- Enable RLS on organization_members
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Users can see memberships in orgs they belong to
CREATE POLICY "org_members_select" ON organization_members
FOR SELECT USING (
  user_id = auth.uid()
  OR organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Users can insert their own membership (when creating an org)
CREATE POLICY "org_members_insert_self" ON organization_members
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Owners/admins can add other members
CREATE POLICY "org_members_insert_admin" ON organization_members
FOR INSERT WITH CHECK (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);

-- Owners/admins can delete members (not themselves if owner)
CREATE POLICY "org_members_delete_admin" ON organization_members
FOR DELETE USING (
  organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
  )
);
