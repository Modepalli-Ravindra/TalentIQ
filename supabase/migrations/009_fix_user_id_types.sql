-- ==========================================
-- FIX: Recreate Phase 3 tables with TEXT user columns
-- (auth system uses string IDs like 'user-103', not UUIDs)
-- ==========================================

-- Drop tables in dependency order
DROP TABLE IF EXISTS public.company_verification_requests CASCADE;
DROP TABLE IF EXISTS public.candidate_comparisons CASCADE;
DROP TABLE IF EXISTS public.resume_improvements CASCADE;
DROP TABLE IF EXISTS public.copilot_messages CASCADE;
DROP TABLE IF EXISTS public.copilot_conversations CASCADE;
DROP TABLE IF EXISTS public.calendar_events CASCADE;
DROP TABLE IF EXISTS public.calendar_connections CASCADE;
DROP TABLE IF EXISTS public.interview_schedules CASCADE;

-- 1. Interview Schedules
CREATE TABLE public.interview_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID,
    candidate_id TEXT NOT NULL,
    recruiter_id TEXT,
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
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON public.interview_schedules(status);

-- 2. Calendar Connections
CREATE TABLE public.calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
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

-- 3. Calendar Events
CREATE TABLE public.calendar_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    connection_id UUID,
    interview_id UUID,
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

-- 4. AI Copilot Conversations
CREATE TABLE public.copilot_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT,
    context_type TEXT DEFAULT 'general',
    context_id UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. AI Copilot Messages
CREATE TABLE public.copilot_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES public.copilot_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON public.copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON public.copilot_messages(conversation_id);

-- 6. Resume Improvements
CREATE TABLE public.resume_improvements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
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

-- 7. Candidate Comparisons
CREATE TABLE public.candidate_comparisons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    recruiter_id TEXT NOT NULL,
    job_id UUID,
    candidate_ids TEXT[] NOT NULL,
    comparison_data JSONB NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_candidate_comparisons_recruiter ON public.candidate_comparisons(recruiter_id);

-- 8. Company Verification Requests
CREATE TABLE public.company_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_domain TEXT,
    recruiter_id TEXT NOT NULL,
    business_registration_number TEXT,
    tax_id TEXT,
    verification_documents JSONB,
    status TEXT NOT NULL DEFAULT 'pending',
    reviewer_id TEXT,
    review_notes TEXT,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_company_verification_requests_recruiter ON public.company_verification_requests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_company_verification_requests_status ON public.company_verification_requests(status);
