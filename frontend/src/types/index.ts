export type UserRole = 'candidate' | 'recruiter' | 'admin' | 'public';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// ── CandidateProfile (legacy compat for modals) ──────────────
export interface CandidateProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  resumeScore: number;
  parsedSkills: string[];
  experienceYears: number;
  appliedJobsCount: number;
  matchHeatmap: { skill: string; mastery: number }[];
}

// ── Profile (Supabase profiles table) ──────────────────────────
export interface Profile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url?: string;
  skills: string[];
  experience_years: number;
  bio?: string;
  headline?: string;
  summary?: string;
  location?: string;
  phone?: string;
  website?: string;
  github_url?: string;
  linkedin_url?: string;
  portfolio_url?: string;
  availability?: string;
  salary_expectation?: string;
  education?: EducationEntry[];
  experience?: ExperienceEntry[];
  projects?: ProjectEntry[];
  languages?: string[];
  certifications?: string[];
  profile_completion?: number;
  created_at: string;
  updated_at?: string;
}

export interface EducationEntry {
  institution: string;
  degree: string;
  field: string;
  start_date: string;
  end_date?: string;
  description?: string;
}

export interface ExperienceEntry {
  company: string;
  title: string;
  start_date: string;
  end_date?: string;
  description?: string;
  current?: boolean;
}

export interface ProjectEntry {
  name: string;
  description: string;
  url?: string;
  technologies: string[];
}

// ── Job (Supabase jobs table) ──────────────────────────────────
export interface JobPosting {
  id: string;
  title: string;
  company: string;
  company_id?: string;
  companyLogo: string;
  company_logo?: string;
  location: string;
  locationType: 'Remote' | 'Hybrid' | 'Onsite';
  type: 'Full-time' | 'Contract' | 'Part-time';
  salaryMin: number;
  salaryMax: number;
  currency: string;
  experienceLevel: 'Entry' | 'Mid' | 'Senior' | 'Lead' | 'Executive';
  techStack: string[];
  skills?: string[];
  description: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  postedAt: string;
  posted_at?: string;
  featured?: boolean;
  matchScore?: number;
  missingSkills?: string[];
  strengths?: string[];
  applicantsCount: number;
  status?: 'draft' | 'published' | 'archived';
  expires_at?: string;
  recruiter_id?: string;
  embedding?: number[];
  created_at?: string;
  updated_at?: string;
}

// ── Application (Supabase applications table) ──────────────────
export type ApplicationStatus = 'applied' | 'screening' | 'assessment' | 'interview' | 'offer' | 'rejected';

export interface CandidateApplication {
  id: string;
  jobId: string;
  job_id?: string;
  jobTitle: string;
  company: string;
  companyLogo: string;
  appliedDate: string;
  applied_at?: string;
  stage: 'Applied' | 'Screening' | 'AI Assessment' | 'Interview' | 'Offer' | 'Rejected';
  matchScore: number;
  ai_match_score?: number;
  ai_feedback?: string;
  nextStep?: string;
  candidateName?: string;
  candidateEmail?: string;
  candidateAvatar?: string;
  candidate_id?: string;
  job?: JobPosting;
  candidate?: Profile;
}

// ── Resume (Supabase resumes table) ────────────────────────────
export interface Resume {
  id: string;
  candidate_id: string;
  file_name: string;
  file_url?: string;
  parsed_skills: string[];
  overall_score: number;
  ats_compatibility_score: number;
  skills_match_score: number;
  experience_impact_score: number;
  version?: number;
  created_at: string;
}

// ── Company (Supabase companies table) ─────────────────────────
export interface Company {
  id: string;
  name: string;
  logo?: string;
  banner?: string;
  description?: string;
  industry?: string;
  size?: string;
  headquarters?: string;
  website?: string;
  benefits?: string[];
  social_links?: Record<string, string>;
  gallery?: CompanyGalleryItem[];
  hiring_status?: string;
  verification_badge?: boolean;
  business_value?: string;
  owner_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CompanyGalleryItem {
  url: string;
  caption?: string;
}

// ── Company Image (Supabase company_images table) ──────────────
export interface CompanyImage {
  id: string;
  company_id: string;
  url: string;
  type: 'logo' | 'banner' | 'gallery';
  order: number;
}

// ── Job Image (Supabase job_images table) ──────────────────────
export interface JobImage {
  id: string;
  job_id: string;
  url: string;
  type: 'logo' | 'banner';
}

// ── Notification (Supabase notifications table) ────────────────
export type NotificationType = 'application_update' | 'job_match' | 'interview_scheduled' | 'message' | 'system' | 'offer';

export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  payload: Record<string, unknown>;
  read: boolean;
  created_at: string;
}

// ── Settings (Supabase settings table) ─────────────────────────
export interface UserSettings {
  user_id: string;
  preferences: UserPreferences;
}

export interface UserPreferences {
  theme?: 'dark' | 'light';
  email_notifications?: boolean;
  push_notifications?: boolean;
  job_alerts?: boolean;
  weekly_digest?: boolean;
  visibility?: 'public' | 'private' | 'recruiters_only';
  saved_searches?: SavedSearch[];
}

export interface SavedSearch {
  id: string;
  label: string;
  filters: Record<string, unknown>;
  created_at: string;
}

// ── Analytics ──────────────────────────────────────────────────
export interface AnalyticsMetrics {
  total_jobs: number;
  total_applications: number;
  total_candidates: number;
  total_companies: number;
  avg_match_score: number;
  conversion_rate: number;
  time_to_hire_avg_days: number;
  top_skills: { skill: string; count: number }[];
  applications_by_status: { status: string; count: number }[];
  hiring_funnel: { stage: string; count: number; rate: number }[];
}

// ── Search ─────────────────────────────────────────────────────
export interface SearchFilters {
  query?: string;
  location?: string;
  locationType?: string[];
  type?: string[];
  experienceLevel?: string[];
  salaryMin?: number;
  salaryMax?: number;
  skills?: string[];
  industry?: string[];
  companySize?: string[];
  matchScoreMin?: number;
}

// ── External Job (Arbeitnow ETL via FastAPI) ──────────────────
export interface ExternalJob {
  id: string;
  external_id: string;
  title: string;
  company_name: string;
  company_logo: string | null;
  location: string | null;
  is_remote: boolean;
  employment_type: string | null;
  description: string | null;
  tags: string[];
  job_url: string | null;
  source: string;
  published_at: string | null;
  ai_summary: string | null;
  ai_skills: string[];
  ai_seniority: string | null;
  ai_salary_estimate: string | null;
  ai_department: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ── Component Props Helpers ────────────────────────────────────
export interface PaginatedResult<T> {
  data: T[];
  count: number;
  hasMore: boolean;
  nextCursor?: string;
}

export interface APIError {
  message: string;
  code?: string;
  details?: string;
}
