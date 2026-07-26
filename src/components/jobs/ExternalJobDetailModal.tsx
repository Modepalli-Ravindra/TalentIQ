import React from 'react';
import { X, MapPin, Clock, Building2, ExternalLink, Sparkles, Globe, Tag, Briefcase } from 'lucide-react';
import { ExternalJob } from '../../lib/api';

interface ExternalJobDetailModalProps {
  job: ExternalJob;
  onClose: () => void;
  onApply: () => void;
  onEvaluateFit?: () => void;
}

export const ExternalJobDetailModal: React.FC<ExternalJobDetailModalProps> = ({
  job,
  onClose,
  onApply,
  onEvaluateFit,
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#111827]">
          <div className="flex items-center gap-3">
            {job.company_logo ? (
              <img src={job.company_logo} alt={job.company_name} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10" />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-blue-400" />
              </div>
            )}
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">{job.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{job.company_name}</span>
                {job.location && (
                  <>
                    <span>&bull;</span>
                    <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {/* Meta info */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#111827] border border-[#27272A]">
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-mono block">Source</span>
              <span className="font-semibold text-blue-400 flex items-center gap-1">
                <Globe className="w-3 h-3" /> {job.source}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-mono block">Remote</span>
              <span className={`font-semibold ${job.is_remote ? 'text-emerald-400' : 'text-gray-300'}`}>
                {job.is_remote ? 'Yes' : 'No'}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-mono block">Type</span>
              <span className="font-semibold text-gray-200">{job.employment_type || 'Not specified'}</span>
            </div>
            <div>
              <span className="text-[10px] text-gray-500 uppercase font-mono block">AI Seniority</span>
              <span className="font-semibold text-purple-400">{job.ai_seniority || 'N/A'}</span>
            </div>
          </div>

          {/* AI Analysis */}
          {(job.ai_department || job.ai_salary_estimate) && (
            <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/20 space-y-2">
              <h3 className="text-xs font-bold text-purple-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI Analysis
              </h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                {job.ai_department && (
                  <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="text-gray-200 ml-1">{job.ai_department}</span>
                  </div>
                )}
                {job.ai_salary_estimate && (
                  <div>
                    <span className="text-gray-500">Est. Salary:</span>
                    <span className="text-emerald-400 ml-1">{job.ai_salary_estimate}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tags */}
          {job.tags?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5 text-blue-400" /> Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.tags.map((tag, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-[#111827] text-gray-300 border border-[#27272A]">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Skills */}
          {job.ai_skills?.length > 0 && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-purple-400" /> AI Extracted Skills
              </h3>
              <div className="flex flex-wrap gap-1.5">
                {job.ai_skills.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 rounded-lg text-[11px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/30">
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div>
              <h3 className="text-sm font-bold text-white mb-2">Description</h3>
              <div className="text-xs text-gray-300 leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
                {job.description}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#27272A] bg-[#111827] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onEvaluateFit && (
              <button
                onClick={onEvaluateFit}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold hover:bg-purple-500/20 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Evaluate AI Fit
              </button>
            )}
            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-[#18181B] text-gray-300 border border-[#27272A] rounded-xl text-xs font-semibold hover:bg-white/5 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View Original
              </a>
            )}
          </div>
          <button
            onClick={onApply}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition-all"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};
