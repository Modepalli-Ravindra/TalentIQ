import React from 'react';
import { MapPin, Clock, Building2, ExternalLink, Sparkles, ArrowRight, Globe } from 'lucide-react';
import { ExternalJob } from '../../lib/api';

interface ExternalJobCardProps {
  job: ExternalJob;
  onSelect: () => void;
}

export const ExternalJobCard: React.FC<ExternalJobCardProps> = ({ job, onSelect }) => {
  return (
    <div
      onClick={onSelect}
      className="glass-card glass-card-hover rounded-2xl p-6 relative flex flex-col justify-between overflow-hidden group cursor-pointer"
    >
      <div>
        {/* Top Meta */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3.5">
            {job.company_logo ? (
              <img
                src={job.company_logo}
                alt={job.company_name}
                className="w-12 h-12 rounded-xl object-cover ring-1 ring-white/10 bg-[#111827]"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-blue-600/20 flex items-center justify-center ring-1 ring-white/10">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <div>
              <span className="text-xs font-semibold text-gray-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-400" />
                {job.company_name}
              </span>
              <h3 className="text-base font-bold text-white hover:text-blue-400 transition-colors mt-0.5 line-clamp-1">
                {job.title}
              </h3>
            </div>
          </div>

          {job.ai_seniority && (
            <span className="px-2.5 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-[10px] font-mono font-medium whitespace-nowrap">
              {job.ai_seniority}
            </span>
          )}
        </div>

        {/* Location & Source */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-gray-400 mb-4 font-medium">
          {job.location && (
            <span className="flex items-center gap-1 text-gray-300">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              {job.location}
            </span>
          )}
          {job.is_remote && (
            <span className="px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-mono">
              Remote
            </span>
          )}
          <span className="flex items-center gap-1 text-gray-400">
            <Globe className="w-3.5 h-3.5 text-gray-500" />
            {job.source}
          </span>
          {job.published_at && (
            <span className="flex items-center gap-1 text-gray-400">
              <Clock className="w-3.5 h-3.5 text-gray-500" />
              {new Date(job.published_at).toLocaleDateString()}
            </span>
          )}
        </div>

        {/* AI Summary or Description */}
        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed mb-5">
          {job.ai_summary || job.description || 'No description available'}
        </p>

        {/* Tags */}
        {job.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.tags.slice(0, 6).map((tag, i) => (
              <span
                key={i}
                className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#111827] text-gray-300 border border-[#27272A] hover:border-blue-500/40 hover:text-blue-300 transition-colors"
              >
                {tag}
              </span>
            ))}
            {job.tags.length > 6 && (
              <span className="px-2 py-1 text-[11px] text-gray-500 font-mono">+{job.tags.length - 6}</span>
            )}
          </div>
        )}

        {/* AI Skills */}
        {job.ai_skills?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {job.ai_skills.slice(0, 4).map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20"
              >
                <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-[#27272A] gap-3">
        {job.employment_type && (
          <span className="px-2.5 py-1 rounded-lg text-[10px] font-mono bg-[#111827] text-gray-400 border border-[#27272A]">
            {job.employment_type}
          </span>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onSelect(); }}
          className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 transition-all group-hover:translate-x-0.5 ml-auto"
        >
          View Details
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
