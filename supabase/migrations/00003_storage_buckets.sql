-- =============================================
-- Kiyoko AI — Storage Buckets & Policies
-- Migration: 00003_storage_buckets.sql
-- =============================================

-- =============================================
-- BUCKET: project-assets (public, 50MB, images/video/pdf)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-assets',
  'project-assets',
  true,
  52428800, -- 50MB max
  ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'application/pdf']
);

-- =============================================
-- BUCKET: avatars (public, 5MB)
-- =============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'avatars',
  'avatars',
  true,
  5242880 -- 5MB max
);

-- =============================================
-- BUCKET: exports (private)
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES (
  'exports',
  'exports',
  false
);

-- =============================================
-- STORAGE POLICIES
-- =============================================

-- Approved users can upload to project-assets
CREATE POLICY "Approved users upload assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'project-assets'
    AND (SELECT public.is_approved())
  );

-- Approved users can upload avatars
CREATE POLICY "Approved users upload avatars"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars'
    AND (SELECT public.is_approved())
  );

-- Approved users can upload exports
CREATE POLICY "Approved users upload exports"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'exports'
    AND (SELECT public.is_approved())
  );

-- Public read access for project-assets and avatars
CREATE POLICY "Public read assets"
  ON storage.objects FOR SELECT
  USING (
    bucket_id IN ('project-assets', 'avatars')
  );

-- Authenticated users can read their own exports (folder structure: user_id/...)
CREATE POLICY "Users read own exports"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Owners can delete their own assets (folder structure: user_id/...)
CREATE POLICY "Owners delete own assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'project-assets'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own avatars
CREATE POLICY "Users delete own avatars"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can delete their own exports
CREATE POLICY "Users delete own exports"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'exports'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Users can update (overwrite) their own assets
CREATE POLICY "Owners update own assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id IN ('project-assets', 'avatars')
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
