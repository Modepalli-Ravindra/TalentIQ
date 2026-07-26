-- ==========================================
-- TalentIQ AI - Storage Bucket Setup
-- Run this in Supabase SQL Editor after creating the bucket via Dashboard
-- ==========================================

-- 1. Create the 'talentiq' bucket via Dashboard:
--    Go to Storage → New Bucket
--    Name: talentiq
--    Public: false (private)
--    File size limit: 10MB
--    Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, image/jpeg, image/png, image/webp

-- 2. After creating the bucket, run these RLS policies:

-- Allow authenticated users to upload to their own folders
CREATE POLICY "Users can upload own resumes"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'resumes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to read their own resumes
CREATE POLICY "Users can view own resumes"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'resumes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to delete their own resumes
CREATE POLICY "Users can delete own resumes"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'resumes'
  AND (storage.foldername(name))[2] = auth.uid()::text
);

-- Allow authenticated users to upload avatars
CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Allow anyone to read avatars (public)
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'avatars'
);

-- Allow authenticated users to upload company images
CREATE POLICY "Authenticated users can upload company images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'companies'
);

-- Allow anyone to view company images (public)
CREATE POLICY "Company images are publicly accessible"
ON storage.objects FOR SELECT TO public
USING (
  bucket_id = 'talentiq'
  AND (storage.foldername(name))[1] = 'companies'
);
