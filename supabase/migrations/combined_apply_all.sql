-- ==========================================
-- COMBINED MIGRATION: Phase 2 + Phase 3
-- Run this in Supabase SQL Editor to apply all missing tables
-- ==========================================

-- 0. Create companies table if missing (dependency for company_verifications)
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    domain TEXT,
    logo_url TEXT,
    description TEXT,
    industry TEXT,
    size TEXT,
    founded_year INTEGER,
    headquarters TEXT,
    website TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ==========================================
-- PHASE 2 TABLES
-- ==========================================

-- 1. Add embedding columns for semantic search
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS embedding vector(512);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS embedding vector(512);
DO $$ BEGIN
    ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS embedding vector(512);
EXCEPTION WHEN others THEN NULL;
END $$;

-- Vector similarity indexes (skip if pgvector not available)
DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_external_jobs_embedding
        ON public.external_jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
EXCEPTION WHEN others THEN NULL;
END $$;

DO $$ BEGIN
    CREATE INDEX IF NOT EXISTS idx_profiles_embedding
        ON public.profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);
EXCEPTION WHEN others THEN NULL;
END $$;

-- 2. Sync metadata columns for incremental ETL
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS etag TEXT;
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMPTZ;
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'active';
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMPTZ;

-- 3. Saved Jobs table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID,
    external_job_id UUID,
    job_type TEXT NOT NULL DEFAULT 'external',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs (user_id);

-- 4. Recently Viewed Jobs table
CREATE TABLE IF NOT EXISTS public.recently_viewed_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID,
    external_job_id UUID,
    job_type TEXT NOT NULL DEFAULT 'external',
    viewed_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recent_jobs_user ON public.recently_viewed_jobs (user_id, viewed_at DESC);

-- 5. Email Queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    email_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue (status, created_at);

-- 6. Audit Logs table (immutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address TEXT,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action, created_at DESC);

-- 7. Company Verifications table
CREATE TABLE IF NOT EXISTS public.company_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending',
    documents JSONB DEFAULT '[]',
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. Recommendation Logs
CREATE TABLE IF NOT EXISTS public.recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID,
    external_job_id UUID,
    match_score INT,
    reason TEXT,
    skills_matched TEXT[] DEFAULT '{}',
    skills_missing TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user ON public.recommendation_logs (user_id, created_at DESC);

-- 9. Semantic search function
CREATE OR REPLACE FUNCTION search_jobs_semantic(
    query_embedding vector(512),
    match_count INT DEFAULT 20
)
RETURNS TABLE (
    id UUID, external_id TEXT, title TEXT, company_name TEXT, company_logo TEXT,
    location TEXT, is_remote BOOLEAN, employment_type TEXT, description TEXT,
    tags TEXT[], job_url TEXT, source TEXT, published_at TIMESTAMPTZ,
    ai_summary TEXT, ai_skills TEXT[], ai_seniority TEXT,
    ai_salary_estimate TEXT, ai_department TEXT, similarity FLOAT
)
LANGUAGE plpgsql STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        ej.id, ej.external_id, ej.title, ej.company_name, ej.company_logo,
        ej.location, ej.is_remote, ej.employment_type, ej.description, ej.tags,
        ej.job_url, ej.source, ej.published_at, ej.ai_summary, ej.ai_skills,
        ej.ai_seniority, ej.ai_salary_estimate, ej.ai_department,
        1 - (ej.embedding <=> query_embedding) AS similarity
    FROM public.external_jobs ej
    WHERE ej.embedding IS NOT NULL
    ORDER BY ej.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- ==========================================
-- PHASE 3 TABLES
-- ==========================================

-- 10. Interview Schedules
CREATE TABLE IF NOT EXISTS public.interview_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.external_jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    interview_type TEXT NOT NULL DEFAULT 'video',
    status TEXT NOT NULL DEFAULT 'scheduled',
    meeting_url TEXT,
    meeting_id TEXT,
    notes TEXT,
    feedback TEXT,
    rating INTEGER,
    reminder_sent BOOLEAN DEFAULT FALSE,
    calendar_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_candidate ON public.interview_schedules(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_recruiter ON public.interview_schedules(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_at ON public.interview_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON public.interview_schedules(status);

-- 11. Calendar Connections
CREATE TABLE IF NOT EXISTS public.calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id TEXT,
    calendar_name TEXT,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON public.calendar_connections(user_id);

-- 12. Calendar Events
CREATE TABLE IF NOT EXISTS public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    connection_id UUID REFERENCES public.calendar_connections(id) ON DELETE CASCADE,
    interview_id UUID REFERENCES public.interview_schedules(id) ON DELETE SET NULL,
    external_event_id TEXT,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    timezone TEXT DEFAULT 'UTC',
    location TEXT,
    is_interview BOOLEAN DEFAULT FALSE,
    synced BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_calendar_events_user ON public.calendar_events(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_events_time ON public.calendar_events(start_time, end_time);

-- 13. AI Copilot Conversations
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    context_type TEXT DEFAULT 'general',
    context_id UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 14. AI Copilot Messages
CREATE TABLE IF NOT EXISTS public.copilot_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON public.copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON public.copilot_messages(conversation_id);

-- 15. Resume Improvements
CREATE TABLE IF NOT EXISTS public.resume_improvements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID,
    original_text TEXT NOT NULL,
    improved_text TEXT NOT NULL,
    improvement_type TEXT NOT NULL,
    target_job_description TEXT,
    suggestions JSONB,
    score_before INTEGER,
    score_after INTEGER,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_resume_improvements_user ON public.resume_improvements(user_id);

-- 16. Candidate Comparisons
CREATE TABLE IF NOT EXISTS public.candidate_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    job_id UUID REFERENCES public.external_jobs(id) ON DELETE SET NULL,
    candidate_ids UUID[] NOT NULL,
    comparison_data JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_comparisons_recruiter ON public.candidate_comparisons(recruiter_id);

-- 17. Company Verification Requests
CREATE TABLE IF NOT EXISTS public.company_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_domain TEXT,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_registration_number TEXT,
    tax_id TEXT,
    verification_documents JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_company_verification_requests_recruiter ON public.company_verification_requests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_company_verification_requests_status ON public.company_verification_requests(status);
