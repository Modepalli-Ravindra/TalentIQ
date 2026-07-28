import React from 'react';
import { MapPin, DollarSign, Clock, Sparkles, Building2, ExternalLink, ArrowRight } from 'lucide-react';
import { JobPosting } from '../../types';
import { MatchMeter } from '../ui/MatchMeter';

interface JobCardProps {
  job: JobPosting;
  onSelectJob: (job: JobPosting) => void;
  onAnalyzeFit: (job: JobPosting) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelectJob, onAnalyzeFit }) => {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden group">
      {/* Background Accent Glow on Featured */}
      {job.featured && (
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-2xl pointer-events-none group-hover:bg-blue-500/20 transition-all" />
      )}

      <div>
        {/* Top Meta Info */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            <img
              src={job.companyLogo}
              alt={job.company}
              className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 bg-[#111827]"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-blue-400" />
                  {job.company}
                </span>
                {job.featured && (
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-full text-[10px] font-mono font-medium">
                    Featured
                  </span>
                )}
              </div>
              <h3
                onClick={() => onSelectJob(job)}
                className="text-base font-bold text-white hover:text-blue-400 cursor-pointer transition-colors mt-0.5 line-clamp-1"
              >
                {job.title}
              </h3>
            </div>
          </div>

          {/* AI Match Meter Badge */}
          {job.matchScore && (
            <button
              onClick={() => onAnalyzeFit(job)}
              title="Click to view full AI Fit Breakdown"
              className="focus:outline-none"
            >
              <MatchMeter score={job.matchScore} size="md" />
            </button>
          )}
        </div>

        {/* Location & Salary Info */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 mb-4 font-medium">
          <span className="flex items-center gap-1 text-gray-300">
            <MapPin className="w-3.5 h-3.5 text-blue-400" />
            {job.location} ({job.locationType})
          </span>
          <span className="flex items-center gap-1 text-emerald-400 font-mono">
            <DollarSign className="w-3.5 h-3.5" />
            ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k / year
          </span>
          <span className="flex items-center gap-1 text-gray-400">
            <Clock className="w-3.5 h-3.5 text-gray-500" />
            {job.postedAt}
          </span>
        </div>

        {/* Short Job Description snippet */}
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-5">
          {job.description}
        </p>

        {/* Tech Stack Pills */}
        <div className="flex flex-wrap gap-1.5 mb-6">
          {job.techStack.map((tech) => (
            <span
              key={tech}
              className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#111827] text-gray-300 border border-[#27272A] hover:border-blue-500/40 hover:text-blue-300 transition-colors"
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Action Buttons */}
      <div className="flex items-center justify-between pt-4 border-t border-[#27272A] gap-3">
        <button
          onClick={() => onAnalyzeFit(job)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 text-purple-300 border border-purple-500/30 text-xs font-semibold hover:bg-purple-500/20 transition-all"
        >
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          AI Fit Check
        </button>

        <button
          onClick={() => onSelectJob(job)}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all group-hover:translate-x-0.5"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
