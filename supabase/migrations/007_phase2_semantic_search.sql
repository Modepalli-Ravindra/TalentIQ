-- ==========================================
-- Migration 007: Phase 2 — Semantic Search, Saved Jobs, Recently Viewed, Email Queue
-- ==========================================

-- 1. Add embedding columns for semantic search
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS embedding vector(512);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS embedding vector(512);
ALTER TABLE public.resumes ADD COLUMN IF NOT EXISTS embedding vector(512);

-- Vector similarity indexes (IVFFlat for < 1M rows, switch to HNSW at scale)
CREATE INDEX IF NOT EXISTS idx_external_jobs_embedding
    ON public.external_jobs USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

CREATE INDEX IF NOT EXISTS idx_profiles_embedding
    ON public.profiles USING ivfflat (embedding vector_cosine_ops) WITH (lists = 50);

-- 2. Sync metadata columns for incremental ETL
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS etag TEXT;
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS content_hash TEXT;
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS source_updated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'active' CHECK (sync_status IN ('active', 'expired', 'deleted'));
ALTER TABLE public.external_jobs ADD COLUMN IF NOT EXISTS last_synced_at TIMESTAMP WITH TIME ZONE;

-- 3. Saved Jobs table
CREATE TABLE IF NOT EXISTS public.saved_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID,
    external_job_id UUID,
    job_type TEXT NOT NULL CHECK (job_type IN ('internal', 'external')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, job_id),
    UNIQUE(user_id, external_job_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs (user_id);
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own saved jobs" ON public.saved_jobs FOR ALL USING (auth.uid() = user_id);

-- 4. Recently Viewed Jobs table
CREATE TABLE IF NOT EXISTS public.recently_viewed_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID,
    external_job_id UUID,
    job_type TEXT NOT NULL CHECK (job_type IN ('internal', 'external')),
    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recent_jobs_user ON public.recently_viewed_jobs (user_id, viewed_at DESC);
ALTER TABLE public.recently_viewed_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recent jobs" ON public.recently_viewed_jobs FOR ALL USING (auth.uid() = user_id);

-- 5. Email Queue table
CREATE TABLE IF NOT EXISTS public.email_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    to_email TEXT NOT NULL,
    to_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    email_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'sent', 'failed')),
    attempts INT DEFAULT 0,
    max_attempts INT DEFAULT 3,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_email_queue_status ON public.email_queue (status, created_at);
ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role manages email queue" ON public.email_queue FOR ALL USING (true);

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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs (action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_resource ON public.audit_logs (resource_type, resource_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view audit logs" ON public.audit_logs FOR SELECT USING (true);
CREATE POLICY "System can insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Prevent updates/deletes on audit logs
CREATE OR REPLACE FUNCTION prevent_audit_log_modification()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable and cannot be modified or deleted';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_logs_immutable
    BEFORE UPDATE OR DELETE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_log_modification();

-- 7. Company Verifications table
CREATE TABLE IF NOT EXISTS public.company_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    documents JSONB DEFAULT '[]',
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_company_verifications_status ON public.company_verifications (status);
ALTER TABLE public.company_verifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read company verifications" ON public.company_verifications FOR SELECT USING (true);
CREATE POLICY "Users can submit verification" ON public.company_verifications FOR INSERT WITH CHECK (auth.uid() = submitted_by);

-- 8. Recommendations log (track what was recommended)
CREATE TABLE IF NOT EXISTS public.recommendation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    job_id UUID,
    external_job_id UUID,
    match_score INT,
    reason TEXT,
    skills_matched TEXT[] DEFAULT '{}',
    skills_missing TEXT[] DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_recommendation_logs_user ON public.recommendation_logs (user_id, created_at DESC);
ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own recommendation logs" ON public.recommendation_logs FOR SELECT USING (auth.uid() = user_id);

-- 9. pgvector semantic search function for jobs
CREATE OR REPLACE FUNCTION search_jobs_semantic(
    query_embedding vector(512),
    match_count INT DEFAULT 20
)
RETURNS TABLE (
    id UUID,
    external_id TEXT,
    title TEXT,
    company_name TEXT,
    company_logo TEXT,
    location TEXT,
    is_remote BOOLEAN,
    employment_type TEXT,
    description TEXT,
    tags TEXT[],
    job_url TEXT,
    source TEXT,
    published_at TIMESTAMPTZ,
    ai_summary TEXT,
    ai_skills TEXT[],
    ai_seniority TEXT,
    ai_salary_estimate TEXT,
    ai_department TEXT,
    similarity FLOAT
)
LANGUAGE plpgsql
STABLE
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
