-- ==========================================
-- TalentIQ AI - Supabase Database Schema & RLS
-- ==========================================

-- 1. Enable pgvector extension for AI semantic search embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Profiles Table (Linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    avatar_url TEXT,
    skills TEXT[] DEFAULT '{}',
    experience_years INT DEFAULT 0,
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Jobs Table (With pgvector embedding for AI matching)
CREATE TABLE IF NOT EXISTS public.jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    company_logo TEXT,
    location TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('full-time', 'part-time', 'contract', 'remote')),
    salary_range TEXT NOT NULL,
    experience_level TEXT NOT NULL,
    description TEXT NOT NULL,
    requirements TEXT[] DEFAULT '{}',
    skills TEXT[] DEFAULT '{}',
    match_score INT DEFAULT 85,
    posted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    -- vector embedding column for semantic search (OpenAI text-embedding-3-small dimension: 1536)
    embedding vector(1536)
);

-- 4. Applications Table
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('applied', 'screening', 'assessment', 'interview', 'offer', 'rejected')) DEFAULT 'applied',
    ai_match_score INT NOT NULL DEFAULT 85,
    ai_feedback TEXT,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. Resumes Table (AI Resume Analysis Engine)
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    candidate_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    parsed_skills TEXT[] DEFAULT '{}',
    overall_score INT NOT NULL DEFAULT 90,
    ats_compatibility_score INT DEFAULT 94,
    skills_match_score INT DEFAULT 88,
    experience_impact_score INT DEFAULT 92,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can view all profiles, but edit only their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Jobs: Anyone can read jobs, recruiters can manage their jobs
CREATE POLICY "Jobs are viewable by everyone" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Recruiters can insert jobs" ON public.jobs FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Applications: Candidates view their applications, recruiters view applications for their posted jobs
CREATE POLICY "Candidates can view own applications" ON public.applications FOR SELECT USING (auth.uid() = candidate_id);
CREATE POLICY "Candidates can create applications" ON public.applications FOR INSERT WITH CHECK (auth.uid() = candidate_id);

-- Resumes: Candidates manage their own resumes
CREATE POLICY "Candidates manage own resumes" ON public.resumes FOR ALL USING (auth.uid() = candidate_id);

-- 6. Companies Table
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    logo TEXT,
    banner TEXT,
    description TEXT,
    industry TEXT,
    size TEXT,
    headquarters TEXT,
    website TEXT,
    benefits TEXT[],
    social_links JSONB,
    gallery JSONB,
    hiring_status TEXT,
    verification_badge BOOLEAN DEFAULT false,
    business_value TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Company Images Table (logo, banner, gallery)
CREATE TABLE IF NOT EXISTS public.company_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('logo','banner','gallery')),
    "order" INT DEFAULT 0
);

-- 8. Job Images Table (logo, banner)
CREATE TABLE IF NOT EXISTS public.job_images (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('logo','banner'))
);

-- 9. Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    payload JSONB,
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 10. Settings Table (user preferences)
CREATE TABLE IF NOT EXISTS public.settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    preferences JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_jobs_recruiter_id ON public.jobs (recruiter_id);
CREATE INDEX IF NOT EXISTS idx_applications_candidate_id ON public.applications (candidate_id);
CREATE INDEX IF NOT EXISTS idx_applications_job_id ON public.applications (job_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, read);

-- RLS policies for new tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- Companies: public read, owners can insert/update/delete
CREATE POLICY "Public companies are viewable by everyone" ON public.companies FOR SELECT USING (true);
CREATE POLICY "Owners can manage their companies" ON public.companies FOR ALL USING (auth.uid() = id);

-- Company Images: owners can manage their company's images
CREATE POLICY "Company image owners" ON public.company_images FOR ALL USING (auth.uid() = (
    SELECT company_id FROM public.companies WHERE id = company_id
));

-- Job Images: recruiters can manage images for their jobs
CREATE POLICY "Job image owners" ON public.job_images FOR ALL USING (auth.uid() = (
    SELECT recruiter_id FROM public.jobs WHERE id = job_id
));

-- Notifications: users can read/write their own notifications
CREATE POLICY "User notifications" ON public.notifications FOR ALL USING (auth.uid() = user_id);

-- Settings: users can read/write their own settings
CREATE POLICY "User settings" ON public.settings FOR ALL USING (auth.uid() = user_id);
