import React, { useState } from 'react';
import { Search, Filter, Sparkles, MapPin, Check, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { JobPosting, ExternalJob } from '../types';
import { JobCard } from '../components/jobs/JobCard';
import { ExternalJobCard } from '../components/jobs/ExternalJobCard';
import { useJobSearch } from '../hooks/useJobs';

interface JobSearchPageProps {
  onSelectJob: (job: JobPosting) => void;
  onAnalyzeFit: (job: JobPosting) => void;
  onExternalJobSelect?: (job: ExternalJob) => void;
}

export const JobSearchPage: React.FC<JobSearchPageProps> = ({
  onSelectJob,
  onAnalyzeFit,
  onExternalJobSelect,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTech, setSelectedTech] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('published_at');

  const availableTechs = ['React', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'Node.js', 'AWS'];

  const { data, isLoading, isFetching } = useJobSearch({
    keyword: searchTerm || undefined,
    is_remote: remoteOnly || undefined,
    tags: selectedTech.length > 0 ? selectedTech : undefined,
    sort_by: sortBy,
    sort_order: 'desc',
    page,
    per_page: 12,
  });

  const toggleTechFilter = (tech: string) => {
    setSelectedTech((prev) =>
      prev.includes(tech) ? prev.filter((t) => t !== tech) : [...prev, tech]
    );
    setPage(1);
  };

  const jobs = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
      {/* Header Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-[#18181B] border border-blue-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" /> Live Jobs from Arbeitnow
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Real Developer Jobs
          </h1>
          <p className="text-xs text-gray-400 max-w-xl leading-relaxed">
            Live job listings sourced from Arbeitnow, enriched with AI analysis. All data is real-time.
          </p>
        </div>

        <div className="z-10 bg-[#111827] border border-[#27272A] p-4 rounded-2xl text-center min-w-[140px]">
          <span className="text-2xl font-extrabold text-white block">{totalCount}</span>
          <span className="text-[10px] text-gray-400 font-mono uppercase tracking-wider">Live Jobs</span>
        </div>
      </div>

      {/* Main Search & Filter Control Bar */}
      <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4 glass-card">
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full flex items-center bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 gap-3 focus-within:border-blue-500 transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs by title, company, or keyword..."
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setPage(1); }}
              onKeyDown={(e) => { if (e.key === 'Enter') setPage(1); }}
            />
            {isFetching && <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => { setRemoteOnly(!remoteOnly); setPage(1); }}
              className={`flex-1 sm:flex-none px-4 py-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 transition-all ${
                remoteOnly
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                  : 'bg-[#09090B] border-[#27272A] text-gray-400 hover:text-white'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" /> Remote Only
            </button>

            <select
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
              className="px-3 py-3 rounded-xl text-xs font-semibold bg-[#09090B] border border-[#27272A] text-gray-400 hover:text-white focus:outline-none focus:border-blue-500"
            >
              <option value="published_at">Newest</option>
              <option value="created_at">Recently Added</option>
              <option value="title">Title A-Z</option>
            </select>
          </div>
        </div>

        {/* Tech Stack Filter Tags */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#27272A]">
          <span className="text-xs font-mono text-gray-500 mr-2 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-gray-400" /> Filter Tech:
          </span>
          {availableTechs.map((tech) => {
            const selected = selectedTech.includes(tech);
            return (
              <button
                key={tech}
                onClick={() => toggleTechFilter(tech)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono transition-all flex items-center gap-1.5 ${
                  selected
                    ? 'bg-blue-600 text-white border border-blue-400 shadow-md shadow-blue-600/20'
                    : 'bg-[#09090B] text-gray-400 border border-[#27272A] hover:text-white hover:border-gray-500'
                }`}
              >
                {selected && <Check className="w-3 h-3 text-white" />}
                {tech}
              </button>
            );
          })}

          {selectedTech.length > 0 && (
            <button
              onClick={() => { setSelectedTech([]); setPage(1); }}
              className="text-xs text-rose-400 hover:underline font-mono ml-auto"
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
            <span className="text-xs text-gray-400 font-mono">Fetching live jobs...</span>
          </div>
        </div>
      )}

      {/* Results */}
      {!isLoading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {jobs.length === 0 ? (
              <div className="col-span-2 py-16 text-center space-y-3 bg-[#18181B] border border-[#27272A] rounded-2xl glass-card">
                <div className="p-3 w-12 h-12 rounded-full bg-white/5 text-gray-400 mx-auto flex items-center justify-center">
                  <Search className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-white">No Jobs Found</h3>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  Try adjusting your filters or search terms. Jobs are synced from Arbeitnow automatically.
                </p>
              </div>
            ) : (
              jobs.map((job) => (
                <ExternalJobCard
                  key={job.id}
                  job={job}
                  onSelect={() => onExternalJobSelect?.(job)}
                />
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] border border-[#27272A] text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </button>
              <span className="text-xs font-mono text-gray-400">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] border border-[#27272A] text-gray-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
