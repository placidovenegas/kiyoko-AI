-- Add freelance to org_type enum (currently has personal, team, agency)
ALTER TYPE org_type ADD VALUE IF NOT EXISTS 'freelance';
