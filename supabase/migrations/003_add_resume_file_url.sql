-- Add file_url column to resumes table
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS file_url TEXT;
