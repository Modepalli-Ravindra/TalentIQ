import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle2, AlertCircle, BookOpen, TrendingUp, DollarSign, Send, Zap, Loader2 } from 'lucide-react';
import { JobPosting, CandidateProfile, Profile } from '../../types';
import { aiApi, AIFitResult } from '../../lib/api';

interface AIFitAnalyzerModalProps {
  job: JobPosting;
  candidate: CandidateProfile | Profile;
  onClose: () => void;
  onApplySuccess: () => void;
}

export const AIFitAnalyzerModal: React.FC<AIFitAnalyzerModalProps> = ({
  job,
  candidate,
  onClose,
  onApplySuccess
}) => {
  const [isApplying, setIsApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [fit, setFit] = useState<AIFitResult | null>(null);

  useEffect(() => {
    const analyze = async () => {
      setLoading(true);
      try {
        const jobSkills = job.skills || job.techStack || [];
        const jobDesc = `Title: ${job.title}\nCompany: ${job.company}\nDescription: ${job.description || ''}\nSkills: ${jobSkills.join(', ')}`;
        
        const candidateSkills = 'parsedSkills' in candidate ? candidate.parsedSkills : (candidate.skills || []);
        const candidateExperience = 'experience' in candidate ? candidate.experience : [];
        const candidateEducation = 'education' in candidate ? candidate.education : [];
        const candidateSummary = 'summary' in candidate ? candidate.summary : ('bio' in candidate ? candidate.bio : '');

        const profile = {
          parsedSkills: candidateSkills,
          experience: candidateExperience,
          education: candidateEducation,
          summary: candidateSummary,
        };
        const res = await aiApi.fitAnalysis(jobDesc, profile);
        setFit(res.data);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Analysis failed';
        setError(msg);
      } finally {
        setLoading(false);
      }
    };
    analyze();
  }, [job, candidate]);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setApplied(true);
      onApplySuccess();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden glass-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                AI Candidate Fit Analysis
              </h2>
              <p className="text-xs text-gray-400 font-mono">Job: {job.title} at {job.company}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <span className="text-xs text-gray-400 font-mono">Analyzing fit with Groq AI...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-4 py-3 inline-block">
                {error}
              </div>
            </div>
          ) : fit ? (
            <>
              {/* Main Fit Score Hero */}
              <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-purple-950/30 to-slate-900 border border-blue-500/30 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div className="relative flex items-center justify-center w-24 h-24 rounded-full border-4 border-blue-500/40 bg-blue-600/10 shadow-lg shadow-blue-500/20">
                    <div className="text-center">
                      <span className="text-3xl font-extrabold text-white">{fit.match_score}%</span>
                      <span className="block text-[10px] text-blue-300 font-mono">MATCH</span>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold mb-1 flex items-center gap-1">
                      <Zap className="w-3.5 h-3.5" /> {fit.verdict}
                    </div>
                    <h3 className="text-lg font-bold text-white">AI-Powered Analysis</h3>
                    <p className="text-xs text-gray-400 leading-relaxed max-w-sm mt-1">
                      {fit.explanation}
                    </p>
                  </div>
                </div>

                <div className="flex sm:flex-col items-center gap-2 text-xs font-mono bg-[#111827] p-3 rounded-xl border border-[#27272A]">
                  <span className="text-gray-400">Target Range</span>
                  <span className="text-emerald-400 font-bold">${(job.salaryMin/1000).toFixed(0)}k - ${(job.salaryMax/1000).toFixed(0)}k</span>
                </div>
              </div>

              {/* Strengths vs Missing Skills */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-[#111827] border border-[#27272A]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-3">
                    <CheckCircle2 className="w-4 h-4" /> Core Match Strengths
                  </div>
                  <ul className="space-y-2">
                    {fit.strengths.map((str, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        {str}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-xl bg-[#111827] border border-[#27272A]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 mb-3">
                    <AlertCircle className="w-4 h-4" /> Identified Skill Gaps
                  </div>
                  <ul className="space-y-2">
                    {fit.skill_gaps.map((gap, idx) => (
                      <li key={idx} className="flex items-center gap-2 text-xs text-gray-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Learning Recommendations */}
              {fit.recommendations.length > 0 && (
                <div className="p-4 rounded-xl bg-[#111827] border border-[#27272A]">
                  <div className="flex items-center gap-2 text-xs font-semibold text-blue-400 mb-3">
                    <BookOpen className="w-4 h-4" /> Recommended Learning Paths
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {fit.recommendations.slice(0, 4).map((rec, idx) => (
                      <div key={idx} className="p-3 rounded-lg bg-[#18181B] border border-[#27272A] flex items-center justify-between text-xs">
                        <div>
                          <div className="font-semibold text-white">Master {rec.skill}</div>
                          <div className="text-[11px] text-gray-400">AI-Recommended Resource</div>
                        </div>
                        {rec.resource_url && (
                          <a href={rec.resource_url} target="_blank" rel="noopener noreferrer" className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-300 border border-blue-500/30 text-[11px] font-medium hover:bg-blue-600/30">
                            Start
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        <div className="px-6 py-4 border-t border-[#27272A] bg-[#111827] flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors">
            Close
          </button>

          {applied ? (
            <div className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold animate-in fade-in">
              <CheckCircle2 className="w-4 h-4" /> Application Submitted via Smart Flow!
            </div>
          ) : (
            <button
              onClick={handleApply}
              disabled={isApplying || loading}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50"
            >
              {isApplying ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Submitting Application...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Instant One-Click Application
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
