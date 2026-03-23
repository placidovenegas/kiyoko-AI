-- Create project_members table for project-level collaboration
CREATE TABLE IF NOT EXISTS project_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL CHECK (role IN ('viewer', 'editor', 'commenter')),
  invited_by uuid REFERENCES auth.users(id),
  accepted_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;

-- Project owner can manage all members
CREATE POLICY "project_members_owner_all" ON project_members
FOR ALL USING (
  project_id IN (
    SELECT id FROM projects WHERE owner_id = auth.uid()
  )
);

-- Members can see their own membership
CREATE POLICY "project_members_self_select" ON project_members
FOR SELECT USING (user_id = auth.uid());

-- Create index
CREATE INDEX IF NOT EXISTS project_members_project_id_idx ON project_members(project_id);
CREATE INDEX IF NOT EXISTS project_members_user_id_idx ON project_members(user_id);
