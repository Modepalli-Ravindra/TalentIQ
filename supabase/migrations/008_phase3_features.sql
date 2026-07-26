-- ============================================================
-- Migration 008: Phase 3 Features
-- Interview Scheduling, Calendar, Copilot, Resume Improvement,
-- Candidate Comparison, Company Verification
-- ============================================================

-- 1. Interview Scheduling
CREATE TABLE IF NOT EXISTS public.interview_schedules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    job_id UUID REFERENCES public.external_jobs(id) ON DELETE CASCADE,
    candidate_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    scheduled_at TIMESTAMPTZ NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    interview_type TEXT NOT NULL DEFAULT 'video'
        CHECK (interview_type IN ('video', 'phone', 'onsite', 'technical', 'behavioral')),
    status TEXT NOT NULL DEFAULT 'scheduled'
        CHECK (status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'rescheduled')),
    meeting_url TEXT,
    meeting_id TEXT,
    notes TEXT,
    feedback TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    reminder_sent BOOLEAN DEFAULT FALSE,
    calendar_event_id TEXT,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_interview_schedules_candidate ON public.interview_schedules(candidate_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_recruiter ON public.interview_schedules(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_job ON public.interview_schedules(job_id);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_scheduled_at ON public.interview_schedules(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_interview_schedules_status ON public.interview_schedules(status);

ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own interviews"
    ON public.interview_schedules FOR SELECT
    USING (auth.uid() = candidate_id OR auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can create interviews"
    ON public.interview_schedules FOR INSERT
    WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can update own interviews"
    ON public.interview_schedules FOR UPDATE
    USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can delete own interviews"
    ON public.interview_schedules FOR DELETE
    USING (auth.uid() = recruiter_id);

-- 2. Calendar Connections
CREATE TABLE IF NOT EXISTS public.calendar_connections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMPTZ,
    calendar_id TEXT,
    calendar_name TEXT,
    sync_enabled BOOLEAN DEFAULT TRUE,
    last_synced_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'expired', 'disconnected')),
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_calendar_connections_user ON public.calendar_connections(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_calendar_connections_user_provider ON public.calendar_connections(user_id, provider);

ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar connections"
    ON public.calendar_connections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own calendar connections"
    ON public.calendar_connections FOR ALL
    USING (auth.uid() = user_id);

-- 3. Calendar Events
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

ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own calendar events"
    ON public.calendar_events FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own calendar events"
    ON public.calendar_events FOR ALL
    USING (auth.uid() = user_id);

-- 4. AI Copilot Conversations
CREATE TABLE IF NOT EXISTS public.copilot_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT,
    context_type TEXT DEFAULT 'general'
        CHECK (context_type IN ('general', 'job_search', 'resume', 'interview', 'application')),
    context_id UUID,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.copilot_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID REFERENCES public.copilot_conversations(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_copilot_conversations_user ON public.copilot_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_copilot_messages_conversation ON public.copilot_messages(conversation_id);

ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own copilot conversations"
    ON public.copilot_conversations FOR ALL
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view own copilot messages"
    ON public.copilot_messages FOR SELECT
    USING (
        conversation_id IN (
            SELECT id FROM public.copilot_conversations WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own copilot messages"
    ON public.copilot_messages FOR INSERT
    WITH CHECK (
        conversation_id IN (
            SELECT id FROM public.copilot_conversations WHERE user_id = auth.uid()
        )
    );

-- 5. Resume Improvements
CREATE TABLE IF NOT EXISTS public.resume_improvements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    resume_id UUID,
    original_text TEXT NOT NULL,
    improved_text TEXT NOT NULL,
    improvement_type TEXT NOT NULL
        CHECK (improvement_type IN ('rewrite', 'enhance', 'ats_optimize', 'keyword_boost', 'format', 'full')),
    target_job_description TEXT,
    suggestions JSONB,
    score_before INTEGER CHECK (score_before >= 0 AND score_before <= 100),
    score_after INTEGER CHECK (score_after >= 0 AND score_after <= 100),
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_resume_improvements_user ON public.resume_improvements(user_id);

ALTER TABLE public.resume_improvements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own resume improvements"
    ON public.resume_improvements FOR ALL
    USING (auth.uid() = user_id);

-- 6. Candidate Comparisons
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

ALTER TABLE public.candidate_comparisons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can manage own comparisons"
    ON public.candidate_comparisons FOR ALL
    USING (auth.uid() = recruiter_id);

-- 7. Company Verifications (enhanced from Phase 2)
CREATE TABLE IF NOT EXISTS public.company_verification_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    company_name TEXT NOT NULL,
    company_domain TEXT,
    recruiter_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    business_registration_number TEXT,
    tax_id TEXT,
    verification_documents JSONB,
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'under_review', 'approved', 'rejected', 'expired')),
    reviewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    review_notes TEXT,
    verified_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_company_verification_requests_recruiter ON public.company_verification_requests(recruiter_id);
CREATE INDEX IF NOT EXISTS idx_company_verification_requests_status ON public.company_verification_requests(status);

ALTER TABLE public.company_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Recruiters can view own verification requests"
    ON public.company_verification_requests FOR SELECT
    USING (auth.uid() = recruiter_id);

CREATE POLICY "Recruiters can create verification requests"
    ON public.company_verification_requests FOR INSERT
    WITH CHECK (auth.uid() = recruiter_id);

CREATE POLICY "Admins can view all verification requests"
    ON public.company_verification_requests FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Admins can update verification requests"
    ON public.company_verification_requests FOR UPDATE
    USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
    );
