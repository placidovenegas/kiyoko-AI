-- Function to auto-create personal workspace on user signup
CREATE OR REPLACE FUNCTION handle_new_user_org()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  user_name text;
  user_slug text;
BEGIN
  -- Get user name from metadata
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1),
    'Personal'
  );

  user_slug := 'personal-' || NEW.id;

  -- Create personal org
  INSERT INTO organizations (name, slug, org_type)
  VALUES (user_name || ' (Personal)', user_slug, 'personal')
  RETURNING id INTO new_org_id;

  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role)
  VALUES (new_org_id, NEW.id, 'owner');

  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS on_auth_user_created_org ON auth.users;

-- Create trigger on auth.users INSERT
CREATE TRIGGER on_auth_user_created_org
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_user_org();
