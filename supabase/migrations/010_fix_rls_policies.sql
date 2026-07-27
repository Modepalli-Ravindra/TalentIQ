-- ==========================================
-- FIX: Add permissive RLS policies for Phase 3 tables
-- Since auth is handled by app (not Supabase Auth), allow all ops via API key
-- ==========================================

-- Copilot Conversations
ALTER TABLE public.copilot_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all copilot conversations" ON public.copilot_conversations FOR ALL USING (true) WITH CHECK (true);

-- Copilot Messages
ALTER TABLE public.copilot_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all copilot messages" ON public.copilot_messages FOR ALL USING (true) WITH CHECK (true);

-- Resume Improvements
ALTER TABLE public.resume_improvements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all resume improvements" ON public.resume_improvements FOR ALL USING (true) WITH CHECK (true);

-- Interview Schedules
ALTER TABLE public.interview_schedules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all interviews" ON public.interview_schedules FOR ALL USING (true) WITH CHECK (true);

-- Calendar Connections
ALTER TABLE public.calendar_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all calendar connections" ON public.calendar_connections FOR ALL USING (true) WITH CHECK (true);

-- Calendar Events
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all calendar events" ON public.calendar_events FOR ALL USING (true) WITH CHECK (true);

-- Candidate Comparisons
ALTER TABLE public.candidate_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all comparisons" ON public.candidate_comparisons FOR ALL USING (true) WITH CHECK (true);

-- Company Verification Requests
ALTER TABLE public.company_verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all verification requests" ON public.company_verification_requests FOR ALL USING (true) WITH CHECK (true);

-- Also fix Phase 2 tables that might have same issue
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own saved jobs" ON public.saved_jobs;
CREATE POLICY "Allow all saved jobs" ON public.saved_jobs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.recently_viewed_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users manage own recent jobs" ON public.recently_viewed_jobs;
CREATE POLICY "Allow all recent jobs" ON public.recently_viewed_jobs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.email_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Service role manages email queue" ON public.email_queue;
CREATE POLICY "Allow all email queue" ON public.email_queue FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "Allow all audit logs" ON public.audit_logs FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.company_verifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read company verifications" ON public.company_verifications;
DROP POLICY IF EXISTS "Users can submit verification" ON public.company_verifications;
CREATE POLICY "Allow all company verifications" ON public.company_verifications FOR ALL USING (true) WITH CHECK (true);

ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view own recommendation logs" ON public.recommendation_logs;
CREATE POLICY "Allow all recommendation logs" ON public.recommendation_logs FOR ALL USING (true) WITH CHECK (true);
