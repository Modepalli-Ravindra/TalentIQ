import { createClient, RealtimeChannel, SupabaseClient } from '@supabase/supabase-js';
import type {
  Profile,
  JobPosting,
  CandidateApplication,
  Resume,
  Company,
  CompanyImage,
  Notification,
  UserSettings,
  UserPreferences,
  SearchFilters,
  PaginatedResult,
  ApplicationStatus,
} from '../types';

const metaEnv = (import.meta as unknown as { env?: Record<string, string> }).env || {};
const supabaseUrl = metaEnv.VITE_SUPABASE_URL || metaEnv.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = metaEnv.VITE_SUPABASE_ANON_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || metaEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return Boolean(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('https://'));
};

export const supabase: SupabaseClient = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// ── Profiles ───────────────────────────────────────────────────

export const profileService = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data: data as Profile | null, error };
  },

  async getByEmail(email: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .single();
    return { data: data as Profile | null, error };
  },

  async upsert(profile: Partial<Profile> & { id: string; email: string }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert(profile, { onConflict: 'id' })
      .select()
      .single();
    return { data: data as Profile | null, error };
  },

  async update(userId: string, updates: Partial<Profile>) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    return { data: data as Profile | null, error };
  },

  async list(options?: { role?: string; limit?: number; offset?: number }) {
    let query = supabase.from('profiles').select('*', { count: 'exact' });
    if (options?.role) query = query.eq('role', options.role);
    if (options?.limit) query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    const { data, error, count } = await query;
    return { data: data as Profile[] | null, count: count || 0, error };
  },

  async search(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .or(`name.ilike.%${query}%,headline.ilike.%${query}%,bio.ilike.%${query}%`)
      .limit(limit);
    return { data: data as Profile[] | null, error };
  },

  async uploadAvatar(userId: string, file: File) {
    const ext = file.name.split('.').pop();
    const path = `avatars/${userId}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('talentiq')
      .upload(path, file, { upsert: true });
    if (uploadError) return { data: null, error: uploadError };
    const { data: urlData } = supabase.storage.from('talentiq').getPublicUrl(path);
    const avatarUrl = urlData.publicUrl;
    const { data, error } = await supabase
      .from('profiles')
      .update({ avatar_url: avatarUrl })
      .eq('id', userId)
      .select()
      .single();
    return { data: data as Profile | null, error, avatarUrl };
  },
};

// ── Jobs ───────────────────────────────────────────────────────

export const jobService = {
  async get(jobId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    return { data: data as JobPosting | null, error };
  },

  async list(options?: {
    status?: string;
    recruiter_id?: string;
    limit?: number;
    offset?: number;
    cursor?: string;
  }) {
    let query = supabase.from('jobs').select('*', { count: 'exact' });
    if (options?.status) query = query.eq('status', options.status);
    if (options?.recruiter_id) query = query.eq('recruiter_id', options.recruiter_id);
    if (options?.cursor) query = query.gt('created_at', options.cursor);
    query = query.order('created_at', { ascending: false });
    if (options?.limit) query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    const { data, error, count } = await query;
    return { data: data as JobPosting[] | null, count: count || 0, error };
  },

  async create(job: Omit<JobPosting, 'id' | 'postedAt' | 'applicantsCount' | 'created_at' | 'updated_at'> & { recruiter_id: string }) {
    const { data, error } = await supabase
      .from('jobs')
      .insert({
        title: job.title,
        company: job.company,
        company_id: job.company_id,
        company_logo: job.companyLogo || job.company_logo,
        location: job.location,
        type: job.type,
        salary_range: `$${job.salaryMin} - $${job.salaryMax} ${job.currency}`,
        experience_level: job.experienceLevel,
        description: job.description,
        requirements: job.requirements,
        skills: job.techStack || job.skills,
        recruiter_id: job.recruiter_id,
        status: job.status || 'draft',
      })
      .select()
      .single();
    return { data: data as JobPosting | null, error };
  },

  async update(jobId: string, updates: Partial<JobPosting>) {
    const dbUpdates: Record<string, unknown> = {};
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.company !== undefined) dbUpdates.company = updates.company;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.type !== undefined) dbUpdates.type = updates.type;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    if (updates.requirements !== undefined) dbUpdates.requirements = updates.requirements;
    if (updates.skills !== undefined) dbUpdates.skills = updates.skills;
    if (updates.techStack !== undefined) dbUpdates.skills = updates.techStack;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    if (updates.experienceLevel !== undefined) dbUpdates.experience_level = updates.experienceLevel;
    if (updates.expires_at !== undefined) dbUpdates.expires_at = updates.expires_at;
    dbUpdates.updated_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('jobs')
      .update(dbUpdates)
      .eq('id', jobId)
      .select()
      .single();
    return { data: data as JobPosting | null, error };
  },

  async delete(jobId: string) {
    const { error } = await supabase.from('jobs').delete().eq('id', jobId);
    return { error };
  },

  async duplicate(jobId: string) {
    const { data: original, error: fetchError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();
    if (fetchError || !original) return { data: null, error: fetchError };
    const { id, created_at, updated_at, ...rest } = original;
    const { data, error } = await supabase
      .from('jobs')
      .insert({ ...rest, title: `${rest.title} (Copy)`, status: 'draft' })
      .select()
      .single();
    return { data: data as JobPosting | null, error };
  },

  async search(filters: SearchFilters, limit = 20, offset = 0) {
    let query = supabase.from('jobs').select('*', { count: 'exact' });
    if (filters.query) query = query.or(`title.ilike.%${filters.query}%,company.ilike.%${filters.query}%,description.ilike.%${filters.query}%`);
    if (filters.location) query = query.ilike('location', `%${filters.location}%`);
    if (filters.locationType?.length) query = query.in('type', filters.locationType);
    if (filters.experienceLevel?.length) query = query.in('experience_level', filters.experienceLevel);
    if (filters.skills?.length) query = query.overlaps('skills', filters.skills);
    query = query.order('created_at', { ascending: false });
    query = query.range(offset, offset + limit - 1);
    const { data, error, count } = await query;
    return { data: data as JobPosting[] | null, count: count || 0, error };
  },

  async getWithApplicantCount(recruiterId: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, applications(count)')
      .eq('recruiter_id', recruiterId)
      .order('created_at', { ascending: false });
    return { data, error };
  },
};

// ── Applications ───────────────────────────────────────────────

export const applicationService = {
  async get(applicationId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(*), profiles(*)')
      .eq('id', applicationId)
      .single();
    return { data, error };
  },

  async listByCandidate(candidateId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs(*)')
      .eq('candidate_id', candidateId)
      .order('applied_at', { ascending: false });
    return { data: data as CandidateApplication[] | null, error };
  },

  async listByJob(jobId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, profiles(*)')
      .eq('job_id', jobId)
      .order('applied_at', { ascending: false });
    return { data, error };
  },

  async listByRecruiter(recruiterId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('*, jobs!inner(*, recruiter_id), profiles(*)')
      .eq('jobs.recruiter_id', recruiterId)
      .order('applied_at', { ascending: false });
    return { data, error };
  },

  async create(application: { job_id: string; candidate_id: string; ai_match_score?: number; ai_feedback?: string }) {
    const { data, error } = await supabase
      .from('applications')
      .insert({
        job_id: application.job_id,
        candidate_id: application.candidate_id,
        ai_match_score: application.ai_match_score || 85,
        ai_feedback: application.ai_feedback,
        status: 'applied',
      })
      .select()
      .single();
    return { data, error };
  },

  async updateStatus(applicationId: string, status: ApplicationStatus) {
    const { data, error } = await supabase
      .from('applications')
      .update({ status })
      .eq('id', applicationId)
      .select()
      .single();
    return { data, error };
  },

  async updateBatch(updates: { id: string; status: ApplicationStatus }[]) {
    const promises = updates.map(({ id, status }) =>
      supabase.from('applications').update({ status }).eq('id', id)
    );
    const results = await Promise.all(promises);
    const firstError = results.find(r => r.error);
    return { error: firstError?.error || null };
  },

  async getKanbanData(recruiterId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select(`
        *,
        jobs!inner(title, company, recruiter_id),
        profiles(name, email, avatar_url, skills)
      `)
      .eq('jobs.recruiter_id', recruiterId)
      .order('applied_at', { ascending: false });
    return { data, error };
  },

  async getStats(recruiterId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('status, jobs!inner(recruiter_id)')
      .eq('jobs.recruiter_id', recruiterId);
    return { data, error };
  },
};

// ── Resumes ────────────────────────────────────────────────────

export const resumeService = {
  async list(candidateId: string) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('candidate_id', candidateId)
      .order('created_at', { ascending: false });
    return { data: data as Resume[] | null, error };
  },

  async get(resumeId: string) {
    const { data, error } = await supabase
      .from('resumes')
      .select('*')
      .eq('id', resumeId)
      .single();
    return { data: data as Resume | null, error };
  },

  async upload(candidateId: string, file: File, metadata: Partial<Resume>) {
    const ext = file.name.split('.').pop();
    const path = `resumes/${candidateId}/${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('talentiq')
      .upload(path, file);
    if (uploadError) return { data: null, error: uploadError };
    const { data: urlData } = supabase.storage.from('talentiq').getPublicUrl(path);
    const { data, error } = await supabase
      .from('resumes')
      .insert({
        candidate_id: candidateId,
        file_name: file.name,
        file_url: urlData.publicUrl,
        parsed_skills: metadata.parsed_skills || [],
        overall_score: metadata.overall_score || 0,
        ats_compatibility_score: metadata.ats_compatibility_score || 0,
        skills_match_score: metadata.skills_match_score || 0,
        experience_impact_score: metadata.experience_impact_score || 0,
      })
      .select()
      .single();
    return { data: data as Resume | null, error };
  },

  async delete(resumeId: string) {
    const { error } = await supabase.from('resumes').delete().eq('id', resumeId);
    return { error };
  },

  async getDownloadUrl(fileUrl: string) {
    return { url: fileUrl };
  },
};

// ── Companies ──────────────────────────────────────────────────

export const companyService = {
  async get(companyId: string) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('id', companyId)
      .single();
    return { data: data as Company | null, error };
  },

  async list(options?: { limit?: number; offset?: number }) {
    let query = supabase.from('companies').select('*', { count: 'exact' });
    query = query.order('created_at', { ascending: false });
    if (options?.limit) query = query.range(options.offset || 0, (options.offset || 0) + options.limit - 1);
    const { data, error, count } = await query;
    return { data: data as Company[] | null, count: count || 0, error };
  },

  async create(company: Omit<Company, 'id' | 'created_at' | 'updated_at'> & { owner_id: string }) {
    const { data, error } = await supabase
      .from('companies')
      .insert({
        name: company.name,
        logo: company.logo,
        banner: company.banner,
        description: company.description,
        industry: company.industry,
        size: company.size,
        headquarters: company.headquarters,
        website: company.website,
        benefits: company.benefits,
        social_links: company.social_links,
        gallery: company.gallery,
        hiring_status: company.hiring_status,
        verification_badge: company.verification_badge || false,
        business_value: company.business_value,
        owner_id: company.owner_id,
      })
      .select()
      .single();
    return { data: data as Company | null, error };
  },

  async update(companyId: string, updates: Partial<Company>) {
    const { data, error } = await supabase
      .from('companies')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', companyId)
      .select()
      .single();
    return { data: data as Company | null, error };
  },

  async delete(companyId: string) {
    const { error } = await supabase.from('companies').delete().eq('id', companyId);
    return { error };
  },

  async uploadImage(companyId: string, file: File, type: 'logo' | 'banner' | 'gallery') {
    const ext = file.name.split('.').pop();
    const path = `companies/${companyId}/${type}_${Date.now()}.${ext}`;
    const { error: uploadError } = await supabase.storage
      .from('talentiq')
      .upload(path, file);
    if (uploadError) return { data: null, error: uploadError };
    const { data: urlData } = supabase.storage.from('talentiq').getPublicUrl(path);
    const { data, error } = await supabase
      .from('company_images')
      .insert({ company_id: companyId, url: urlData.publicUrl, type })
      .select()
      .single();
    return { data, error, url: urlData.publicUrl };
  },

  async getImages(companyId: string) {
    const { data, error } = await supabase
      .from('company_images')
      .select('*')
      .eq('company_id', companyId)
      .order('order');
    return { data: data as CompanyImage[] | null, error };
  },

  async search(query: string, limit = 20) {
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .or(`name.ilike.%${query}%,industry.ilike.%${query}%,description.ilike.%${query}%`)
      .limit(limit);
    return { data: data as Company[] | null, error };
  },
};

// ── Notifications ──────────────────────────────────────────────

export const notificationService = {
  async list(userId: string, options?: { unreadOnly?: boolean; limit?: number }) {
    let query = supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (options?.unreadOnly) query = query.eq('read', false);
    if (options?.limit) query = query.limit(options.limit);
    const { data, error } = await query;
    return { data: data as Notification[] | null, error };
  },

  async create(notification: { user_id: string; type: string; payload: Record<string, unknown> }) {
    const { data, error } = await supabase
      .from('notifications')
      .insert(notification)
      .select()
      .single();
    return { data: data as Notification | null, error };
  },

  async markRead(notificationId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);
    return { error };
  },

  async markAllRead(userId: string) {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false);
    return { error };
  },

  async getUnreadCount(userId: string) {
    const { count, error } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('read', false);
    return { count: count || 0, error };
  },
};

// ── Settings ───────────────────────────────────────────────────

export const settingsService = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from('settings')
      .select('*')
      .eq('user_id', userId)
      .single();
    return { data: data as UserSettings | null, error };
  },

  async upsert(userId: string, preferences: UserPreferences) {
    const { data, error } = await supabase
      .from('settings')
      .upsert({ user_id: userId, preferences }, { onConflict: 'user_id' })
      .select()
      .single();
    return { data: data as UserSettings | null, error };
  },

  async updatePreferences(userId: string, prefs: Partial<UserPreferences>) {
    const { data: existing } = await settingsService.get(userId);
    const merged = { ...(existing?.preferences || {}), ...prefs };
    return settingsService.upsert(userId, merged);
  },
};

// ── Storage Helpers ────────────────────────────────────────────

export const storageService = {
  async upload(bucket: string, path: string, file: File, options?: { upsert?: boolean }) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, { upsert: options?.upsert ?? false });
    if (error) return { data: null, error };
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(path);
    return { data: { path, url: urlData.publicUrl }, error: null };
  },

  async getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    return data.publicUrl;
  },

  async remove(bucket: string, paths: string[]) {
    const { error } = await supabase.storage.from(bucket).remove(paths);
    return { error };
  },

  async listFiles(bucket: string, folder: string) {
    const { data, error } = await supabase.storage.from(bucket).list(folder);
    return { data, error };
  },
};

// ── Real-time Subscriptions ────────────────────────────────────

export const realtimeService = {
  subscribeToApplications(userId: string, callbacks: {
    onInsert?: (payload: Record<string, unknown>) => void;
    onUpdate?: (payload: Record<string, unknown>) => void;
    onDelete?: (payload: Record<string, unknown>) => void;
  }) {
    const channel = supabase
      .channel('applications-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'applications' }, callbacks.onInsert || (() => {}))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'applications' }, callbacks.onUpdate || (() => {}))
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'applications' }, callbacks.onDelete || (() => {}))
      .subscribe();
    return channel;
  },

  subscribeToNotifications(userId: string, callbacks: {
    onInsert?: (payload: Record<string, unknown>) => void;
    onUpdate?: (payload: Record<string, unknown>) => void;
  }) {
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, callbacks.onInsert || (() => {}))
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, callbacks.onUpdate || (() => {}))
      .subscribe();
    return channel;
  },

  subscribeToJobs(callbacks: {
    onInsert?: (payload: Record<string, unknown>) => void;
    onUpdate?: (payload: Record<string, unknown>) => void;
  }) {
    const channel = supabase
      .channel('jobs-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'jobs' }, callbacks.onInsert || (() => {}))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'jobs' }, callbacks.onUpdate || (() => {}))
      .subscribe();
    return channel;
  },

  unsubscribe(channel: RealtimeChannel) {
    supabase.removeChannel(channel);
  },
};

// ── Analytics ──────────────────────────────────────────────────

export const analyticsService = {
  async getRecruiterStats(recruiterId: string) {
    const { data: jobs, error: jobsError } = await supabase
      .from('jobs')
      .select('id, status')
      .eq('recruiter_id', recruiterId);

    const { data: applications, error: appsError } = await supabase
      .from('applications')
      .select('status, ai_match_score, applied_at')
      .in('job_id', (jobs || []).map((j: { id: string }) => j.id));

    return {
      data: {
        jobs: jobs || [],
        applications: applications || [],
        totalJobs: (jobs || []).length,
        totalApplications: (applications || []).length,
        activeJobs: (jobs || []).filter((j: { status: string }) => j.status === 'published').length,
        avgMatchScore: applications?.length
          ? Math.round(applications.reduce((sum: number, a: { ai_match_score: number }) => sum + (a.ai_match_score || 0), 0) / applications.length)
          : 0,
        byStatus: applications?.reduce((acc: Record<string, number>, a: { status: string }) => {
          acc[a.status] = (acc[a.status] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {},
      },
      error: jobsError || appsError,
    };
  },

  async getCandidateStats(candidateId: string) {
    const { data: applications, error } = await supabase
      .from('applications')
      .select('status, ai_match_score, applied_at, jobs(title, company)')
      .eq('candidate_id', candidateId);

    return {
      data: {
        applications: applications || [],
        totalApplied: (applications || []).length,
        avgMatchScore: applications?.length
          ? Math.round(applications.reduce((sum: number, a: { ai_match_score: number }) => sum + (a.ai_match_score || 0), 0) / applications.length)
          : 0,
        interviews: (applications || []).filter((a: { status: string }) => a.status === 'interview').length,
        offers: (applications || []).filter((a: { status: string }) => a.status === 'offer').length,
      },
      error,
    };
  },
};

// ── Auth Helpers ───────────────────────────────────────────────

export const authService = {
  async getSessions() {
    try {
      const { data, error } = await (supabase.auth as any).listSessions?.() || { data: null, error: null };
      return { data, error };
    } catch {
      return { data: null, error: null };
    }
  },

  async changePassword(newPassword: string) {
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error };
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    return { error };
  },
};
