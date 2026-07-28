import { useQuery } from '@tanstack/react-query';
import { jobsApi, ExternalJob, JobSearchResult } from '../lib/api';

export function useExternalJobs(
  page = 1,
  perPage = 20,
  sortBy = 'published_at',
  sortOrder = 'desc'
) {
  return useQuery<JobSearchResult>({
    queryKey: ['external-jobs', page, perPage, sortBy, sortOrder],
    queryFn: () => jobsApi.list(page, perPage, sortBy, sortOrder),
  });
}

export function useJobSearch(params: {
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
  return useQuery<JobSearchResult>({
    queryKey: ['external-jobs-search', params],
    queryFn: () => jobsApi.search(params),
    enabled: true,
  });
}

export function useExternalJob(jobId: string | null) {
  return useQuery<ExternalJob>({
    queryKey: ['external-job', jobId],
    queryFn: () => jobsApi.getById(jobId!),
    enabled: !!jobId,
  });
}
