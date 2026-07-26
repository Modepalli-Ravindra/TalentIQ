const API_BASE = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api/v1';

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

export interface JobSearchResult {
  data: ExternalJob[];
  count: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface SyncResponse {
  status: string;
  imported: number;
  updated: number;
  duplicates: number;
  failed: number;
  execution_time_seconds: number;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE}${path}`;
  const token = localStorage.getItem('talentiq_token');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });
  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API error ${response.status}: ${error}`);
  }
  return response.json();
}

export const jobsApi = {
  list(page = 1, perPage = 20, sortBy = 'published_at', sortOrder = 'desc') {
    return apiFetch<JobSearchResult>(
      `/jobs?page=${page}&per_page=${perPage}&sort_by=${sortBy}&sort_order=${sortOrder}`
    );
  },

  search(params: {
    keyword?: string;
    location?: string;
    is_remote?: boolean;
    tags?: string[];
    employment_type?: string;
    sort_by?: string;
    sort_order?: string;
    page?: number;
    per_page?: number;
  }) {
    const query = new URLSearchParams();
    if (params.keyword) query.set('keyword', params.keyword);
    if (params.location) query.set('location', params.location);
    if (params.is_remote !== undefined) query.set('is_remote', String(params.is_remote));
    if (params.tags?.length) params.tags.forEach(t => query.append('tags', t));
    if (params.employment_type) query.set('employment_type', params.employment_type);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.sort_order) query.set('sort_order', params.sort_order);
    if (params.page) query.set('page', String(params.page));
    if (params.per_page) query.set('per_page', String(params.per_page));
    return apiFetch<JobSearchResult>(`/jobs/search?${query.toString()}`);
  },

  getById(jobId: string) {
    return apiFetch<ExternalJob>(`/jobs/${jobId}`);
  },

  recommended(skills?: string[], limit = 10) {
    const query = new URLSearchParams();
    if (skills?.length) skills.forEach(s => query.append('skills', s));
    query.set('limit', String(limit));
    return apiFetch<JobSearchResult>(`/jobs/recommended?${query.toString()}`);
  },

  sync(maxPages = 10) {
    return apiFetch<SyncResponse>(`/etl/jobs/sync?max_pages=${maxPages}`, {
      method: 'POST',
    });
  },
};

// --- Search API ---

export interface SemanticSearchParams {
  q: string;
  limit?: number;
  location?: string;
  is_remote?: boolean;
  tags?: string[];
}

export interface SemanticSearchResult {
  success: boolean;
  data: ExternalJob[];
  count: number;
  query: string;
}

export interface SavedJob {
  id: string;
  user_id: string;
  job_id?: string;
  external_job_id?: string;
  job_type: 'internal' | 'external';
  notes?: string;
  created_at: string;
}

export interface Recommendation {
  job: ExternalJob;
  match_score: number;
  skills_matched: string[];
  skills_missing: string[];
  reason: string;
  learning_suggestions: string[];
}

export const searchApi = {
  semantic(params: SemanticSearchParams) {
    const query = new URLSearchParams();
    query.set('q', params.q);
    if (params.limit) query.set('limit', String(params.limit));
    if (params.location) query.set('location', params.location);
    if (params.is_remote !== undefined) query.set('is_remote', String(params.is_remote));
    if (params.tags?.length) params.tags.forEach(t => query.append('tags', t));
    return apiFetch<SemanticSearchResult>(`/search/semantic?${query.toString()}`);
  },

  embedJob(jobId: string) {
    return apiFetch<{ success: boolean; message: string }>(`/jobs/embed?job_id=${jobId}`, { method: 'POST' });
  },

  embedProfile() {
    return apiFetch<{ success: boolean; message: string }>('/profile/embed', { method: 'POST' });
  },
};

// --- Saved Jobs API ---

export const savedJobsApi = {
  list() {
    return apiFetch<{ success: boolean; data: SavedJob[] }>('/saved-jobs');
  },

  save(jobId: string, jobType: 'internal' | 'external' = 'external', notes?: string) {
    return apiFetch<{ success: boolean; data: SavedJob }>('/saved-jobs', {
      method: 'POST',
      body: JSON.stringify({ job_id: jobId, job_type: jobType, notes }),
    });
  },

  remove(id: string) {
    return apiFetch<{ success: boolean }>(`/saved-jobs/${id}`, { method: 'DELETE' });
  },
};

// --- Recommendations API ---

export const recommendationsApi = {
  get(limit = 10) {
    return apiFetch<{ success: boolean; data: Recommendation[] }>(`/recommendations?limit=${limit}`);
  },

  getReasons(limit = 5) {
    return apiFetch<{ success: boolean; data: Recommendation[] }>(`/recommendations/reasons?limit=${limit}`);
  },
};

// --- AI API ---

export interface AISummaryResult {
  summary: string;
  key_responsibilities: string[];
  required_experience: string;
  company_culture_notes: string;
}

export interface AIResumeParseResult {
  name: string | null;
  email: string | null;
  phone: string | null;
  summary: string;
  skills: string[];
  experience: { title: string; company: string; duration: string; highlights: string[] }[];
  education: { degree: string; institution: string; year: string }[];
  certifications: string[];
  years_of_experience: number | null;
}

export interface AIFitResult {
  match_score: number;
  strengths: string[];
  skill_gaps: string[];
  recommendations: { skill: string; resource_url: string }[];
  verdict: string;
  explanation: string;
}

export interface AIBiasResult {
  issues: { type: string; text: string; suggestion: string; severity: 'high' | 'medium' | 'low' }[];
  readability_score: number;
  optimized_description: string;
  summary: string;
}

export interface AIEmailResult {
  subject: string;
  body: string;
}

export interface AITaskSuggestion {
  title: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  estimated_minutes: number;
  due_hint: string;
}

export interface AITaskResult {
  tasks: AITaskSuggestion[];
  insights: string[];
}

export interface AIChatResult {
  response: string;
}

export const aiApi = {
  summarize(description: string, max_sentences = 3) {
    return apiFetch<{ status: string; data: AISummaryResult }>('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify({ description, max_sentences }),
    });
  },

  parseResume(resume_text: string) {
    return apiFetch<{ status: string; data: AIResumeParseResult }>('/ai/parse-resume', {
      method: 'POST',
      body: JSON.stringify({ resume_text }),
    });
  },

  extractSkills(text: string) {
    return apiFetch<{ status: string; data: { skills: string[] } }>('/ai/extract-skills', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  },

  fitAnalysis(job_description: string, candidate_profile: Record<string, unknown>) {
    return apiFetch<{ status: string; data: AIFitResult }>('/ai/fit-analysis', {
      method: 'POST',
      body: JSON.stringify({ job_description, candidate_profile }),
    });
  },

  biasAnalysis(job_text: string) {
    return apiFetch<{ status: string; data: AIBiasResult }>('/ai/bias-analysis', {
      method: 'POST',
      body: JSON.stringify({ job_text }),
    });
  },

  generateEmail(
    email_type: 'interview' | 'feedback' | 'offer' | 'follow_up' | 'rejection',
    candidate_name: string,
    job_title: string,
    company: string,
    additional_context?: string
  ) {
    return apiFetch<{ status: string; data: AIEmailResult }>('/ai/generate-email', {
      method: 'POST',
      body: JSON.stringify({ email_type, candidate_name, job_title, company, additional_context }),
    });
  },

  taskSuggestions(context: {
    pending_applications?: number;
    interviews_scheduled?: number;
    open_positions?: number;
    recent_activity?: string;
    day_of_week?: string;
  }) {
    return apiFetch<{ status: string; data: AITaskResult }>('/ai/task-suggestions', {
      method: 'POST',
      body: JSON.stringify(context),
    });
  },

  chat(prompt: string, context?: string) {
    return apiFetch<{ status: string; data: AIChatResult }>('/ai/chat', {
      method: 'POST',
      body: JSON.stringify({ prompt, context }),
    });
  },
};
