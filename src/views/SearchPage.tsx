import React, { useState, useCallback, useEffect } from 'react';
import { Search, Sparkles, Building2, Users, Briefcase, Loader2 } from 'lucide-react';
import { Company } from '../types';
import { companyService, isSupabaseConfigured } from '../lib/supabase';
import { useJobSearch } from '../hooks/useJobs';
import { ExternalJobCard } from '../components/jobs/ExternalJobCard';
import { ExternalJob } from '../types';

interface SearchPageProps {
  onSelectJob: (job: any) => void;
  onAnalyzeFit: (job: any) => void;
  onSelectCompany?: (company: Company) => void;
  onExternalJobSelect?: (job: ExternalJob) => void;
}

type SearchTab = 'jobs' | 'companies' | 'candidates';

export function SearchPage({ onSelectJob, onAnalyzeFit, onSelectCompany, onExternalJobSelect }: SearchPageProps) {
  const [activeTab, setActiveTab] = useState<SearchTab>('jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [remoteOnly, setRemoteOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useJobSearch({
    keyword: searchQuery || undefined,
    is_remote: remoteOnly || undefined,
    tags: selectedTags.length > 0 ? selectedTags : undefined,
    page,
    per_page: 12,
  });

  const loadCompanies = useCallback(async () => {
    if (isSupabaseConfigured()) {
      const { data } = await companyService.search(searchQuery, 20);
      if (data) setCompanies(data);
    }
  }, [searchQuery]);

  useEffect(() => {
    if (activeTab === 'companies') loadCompanies();
  }, [activeTab, loadCompanies]);

  const availableTechs = ['React', 'Python', 'TypeScript', 'Java', 'Go', 'Rust', 'Node.js', 'AWS'];

  const jobs = data?.data || [];
  const totalCount = data?.count || 0;
  const totalPages = data?.total_pages || 1;

  const handleExternalJobSelect = (ext: ExternalJob) => {
    onExternalJobSelect?.(ext);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-[#18181B] border border-blue-500/30 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI-Powered Search
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Advanced Search</h1>
          <p className="text-xs text-gray-400 max-w-xl">Find live jobs from Arbeitnow with AI-powered analysis</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#18181B] border border-[#27272A] rounded-xl w-fit">
        {[
          { id: 'jobs' as const, label: 'Jobs', icon: Briefcase },
          { id: 'companies' as const, label: 'Companies', icon: Building2 },
          { id: 'candidates' as const, label: 'Candidates', icon: Users },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <tab.icon className="w-3.5 h-3.5" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Search & Filters */}
      <div className="p-4 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 flex items-center bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-3 gap-3 focus-within:border-blue-500 transition-colors">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              className="w-full bg-transparent text-xs text-white placeholder-gray-500 focus:outline-none"
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              onKeyDown={e => { if (e.key === 'Enter') setPage(1); }}
            />
          </div>
          {activeTab === 'jobs' && (
            <>
              <button
                onClick={() => { setRemoteOnly(!remoteOnly); setPage(1); }}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border transition-all ${
                  remoteOnly ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-[#09090B] border-[#27272A] text-gray-400 hover:text-white'
                }`}
              >
                Remote Only
              </button>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-semibold border transition-all ${
                  showFilters ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-[#09090B] border-[#27272A] text-gray-400 hover:text-white'
                }`}
              >
                Filters
              </button>
            </>
          )}
        </div>

        {showFilters && activeTab === 'jobs' && (
          <div className="pt-4 border-t border-[#27272A] space-y-4">
            <div>
              <span className="text-xs text-gray-400 font-medium mb-2 block">Tech Stack</span>
              <div className="flex flex-wrap gap-2">
                {availableTechs.map(tech => (
                  <button
                    key={tech}
                    onClick={() => {
                      setSelectedTags(prev =>
                        prev.includes(tech) ? prev.filter(t => t !== tech) : [...prev, tech]
                      );
                      setPage(1);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all ${
                      selectedTags.includes(tech)
                        ? 'bg-blue-600 text-white border border-blue-400'
                        : 'bg-[#09090B] text-gray-400 border border-[#27272A] hover:text-white'
                    }`}
                  >
                    {tech}
                  </button>
                ))}
              </div>
            </div>
            {selectedTags.length > 0 && (
              <button
                onClick={() => { setSelectedTags([]); setPage(1); }}
                className="text-xs text-rose-400 hover:underline font-mono"
              >
                Clear all filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {isLoading && activeTab === 'jobs' ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
        </div>
      ) : activeTab === 'jobs' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.length === 0 ? (
            <div className="col-span-2 py-16 text-center bg-[#18181B] border border-[#27272A] rounded-2xl">
              <Search className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No jobs found</h3>
              <p className="text-xs text-gray-400 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            jobs.map(job => (
              <ExternalJobCard key={job.id} job={job} onSelect={() => handleExternalJobSelect(job)} />
            ))
          )}
        </div>
      ) : activeTab === 'companies' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.length === 0 ? (
            <div className="col-span-3 py-16 text-center bg-[#18181B] border border-[#27272A] rounded-2xl">
              <Building2 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">No companies found</h3>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            companies.map(company => (
              <div
                key={company.id}
                onClick={() => onSelectCompany?.(company)}
                className="p-5 bg-[#18181B] border border-[#27272A] rounded-2xl hover:border-blue-500/40 transition-all cursor-pointer glass-card"
              >
                <div className="flex items-center gap-3 mb-3">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-10 h-10 rounded-xl object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                      <Building2 className="w-5 h-5 text-blue-400" />
                    </div>
                  )}
                  <div>
                    <h3 className="text-sm font-bold text-white">{company.name}</h3>
                    <p className="text-xs text-gray-400">{company.industry || 'Technology'}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-400 line-clamp-2 mb-3">{company.description || 'No description available'}</p>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="py-16 text-center bg-[#18181B] border border-[#27272A] rounded-2xl">
          <Users className="w-10 h-10 text-gray-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">Candidate Search</h3>
          <p className="text-xs text-gray-400 mt-1">Search for candidates by name, skills, or experience</p>
        </div>
      )}

      {/* Pagination */}
      {activeTab === 'jobs' && totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] border border-[#27272A] text-gray-400 hover:text-white disabled:opacity-40 transition-all"
          >
            Previous
          </button>
          <span className="text-xs font-mono text-gray-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#18181B] border border-[#27272A] text-gray-400 hover:text-white disabled:opacity-40 transition-all"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
