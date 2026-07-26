-- ==========================================
-- Migration 006: External Jobs ETL Table
-- ==========================================

CREATE TABLE IF NOT EXISTS public.external_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id TEXT NOT NULL,
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    company_logo TEXT,
    location TEXT,
    is_remote BOOLEAN DEFAULT false,
    employment_type TEXT,
    description TEXT,
    tags TEXT[] DEFAULT '{}',
    job_url TEXT,
    source TEXT NOT NULL DEFAULT 'arbeitnow',
    published_at TIMESTAMP WITH TIME ZONE,
    ai_summary TEXT,
    ai_skills TEXT[] DEFAULT '{}',
    ai_seniority TEXT,
    ai_salary_estimate TEXT,
    ai_department TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Unique constraint: prevent duplicates by external_id + source
CREATE UNIQUE INDEX IF NOT EXISTS idx_external_jobs_unique ON public.external_jobs (external_id, source);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_external_jobs_source ON public.external_jobs (source);
CREATE INDEX IF NOT EXISTS idx_external_jobs_published_at ON public.external_jobs (published_at DESC);
CREATE INDEX IF NOT EXISTS idx_external_jobs_company ON public.external_jobs (company_name);
CREATE INDEX IF NOT EXISTS idx_external_jobs_location ON public.external_jobs (location);
CREATE INDEX IF NOT EXISTS idx_external_jobs_is_remote ON public.external_jobs (is_remote);
CREATE INDEX IF NOT EXISTS idx_external_jobs_employment_type ON public.external_jobs (employment_type);
CREATE INDEX IF NOT EXISTS idx_external_jobs_tags ON public.external_jobs USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_external_jobs_created_at ON public.external_jobs (created_at DESC);

-- Full text search index
CREATE INDEX IF NOT EXISTS idx_external_jobs_search ON public.external_jobs USING GIN (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(company_name, '') || ' ' || coalesce(description, ''))
);

-- Enable RLS
ALTER TABLE public.external_jobs ENABLE ROW LEVEL SECURITY;

-- Public read, service-role write
CREATE POLICY "External jobs are viewable by everyone" ON public.external_jobs FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert external jobs" ON public.external_jobs FOR INSERT WITH CHECK (true);
CREATE POLICY "Authenticated users can update external jobs" ON public.external_jobs FOR UPDATE USING (true);
CREATE POLICY "Authenticated users can delete external jobs" ON public.external_jobs FOR DELETE USING (true);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_external_jobs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_external_jobs_updated ON public.external_jobs;
CREATE TRIGGER trigger_external_jobs_updated
    BEFORE UPDATE ON public.external_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_external_jobs_timestamp();
