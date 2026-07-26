import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { resumeApi, type ResumeImprovement } from '../../lib/api';
import { JobCardSkeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';
import { Sparkles, FileText, ArrowRight, Check, RotateCcw, Loader2, BarChart3, History } from 'lucide-react';

interface Props {}

const improvementTypes = [
  { value: 'full', label: 'Full Improvement', desc: 'Complete resume overhaul' },
  { value: 'rewrite', label: 'Rewrite', desc: 'Professional rewriting' },
  { value: 'enhance', label: 'Enhance', desc: 'Add more detail & impact' },
  { value: 'ats_optimize', label: 'ATS Optimize', desc: 'Applicant tracking friendly' },
  { value: 'keyword_boost', label: 'Keyword Boost', desc: 'Target job keywords' },
  { value: 'format', label: 'Format', desc: 'Better structure & layout' },
];

export default function ResumeImprovementPage(_props: Props) {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [improvementType, setImprovementType] = useState('full');
  const [improving, setImproving] = useState(false);
  const [result, setResult] = useState<ResumeImprovement | null>(null);
  const [history, setHistory] = useState<ResumeImprovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  const fetchHistory = useCallback(async () => {
    try {
      const data = await resumeApi.getHistory();
      setHistory(data);
    } catch {}
    finally { setLoadingHistory(false); }
  }, []);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleImprove = async () => {
    if (resumeText.trim().length < 50) {
      toast.error('Resume text must be at least 50 characters');
      return;
    }
    setImproving(true);
    setResult(null);
    try {
      const res = await resumeApi.improve({
        original_text: resumeText,
        improvement_type: improvementType,
        target_job_description: jobDescription || undefined,
      });
      setResult(res);
      toast.success('Resume improved!');
      fetchHistory();
    } catch { toast.error('Improvement failed'); }
    finally { setImproving(false); }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">AI Resume Improvement</h1>
        <p className="text-zinc-400 text-sm mt-1">Enhance your resume with AI-powered suggestions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Your Resume</label>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder="Paste your resume text here..."
              className="w-full h-64 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Improvement Type</label>
            <div className="grid grid-cols-2 gap-2">
              {improvementTypes.map(t => (
                <button key={t.value} onClick={() => setImprovementType(t.value)}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    improvementType === t.value
                      ? 'bg-blue-600/20 border-blue-500/50 text-blue-300'
                      : 'bg-zinc-900 border-zinc-700 text-zinc-400 hover:border-zinc-600'
                  }`}>
                  <p className="text-sm font-medium">{t.label}</p>
                  <p className="text-xs opacity-70">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">Target Job Description (optional)</label>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description for targeted optimization..."
              className="w-full h-32 bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <button
            onClick={handleImprove}
            disabled={improving || resumeText.trim().length < 50}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-xl font-medium transition-colors"
          >
            {improving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
            {improving ? 'Improving...' : 'Improve Resume'}
          </button>
        </div>

        <div className="space-y-4">
          {result ? (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Improved Resume</h3>
              </div>

              {(result.score_before || result.score_after) && (
                <div className="flex items-center gap-4 bg-zinc-800/50 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-zinc-400">{result.score_before || '—'}</p>
                    <p className="text-xs text-zinc-500">Before</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-blue-400" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-emerald-400">{result.score_after || '—'}</p>
                    <p className="text-xs text-zinc-500">After</p>
                  </div>
                </div>
              )}

              <div className="bg-zinc-800/50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans">{result.improved_text}</pre>
              </div>

              {result.suggestions && result.suggestions.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-zinc-300 mb-2">Suggestions</h4>
                  <ul className="space-y-1">
                    {(typeof result.suggestions === 'string' ? JSON.parse(result.suggestions) : result.suggestions).map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-zinc-400">
                        <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="flex gap-2">
                <button onClick={() => { navigator.clipboard.writeText(result.improved_text); toast.success('Copied!'); }}
                  className="flex-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
                  Copy to Clipboard
                </button>
                <button onClick={() => { setResumeText(result.improved_text); setResult(null); }}
                  className="flex-1 flex items-center justify-center gap-1 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">
                  <RotateCcw className="w-4 h-4" /> Use as Input
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
              <Sparkles className="w-16 h-16 text-blue-500/20 mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">Resume Preview</h3>
              <p className="text-zinc-400 text-sm">Paste your resume and click improve to see AI-powered suggestions</p>
            </div>
          )}

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
                <History className="w-4 h-4" /> Recent Improvements
              </h3>
              <button onClick={() => setShowHistory(!showHistory)} className="text-xs text-blue-400 hover:text-blue-300">
                {showHistory ? 'Hide' : 'Show'}
              </button>
            </div>
            {showHistory && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {loadingHistory ? (
                  <p className="text-zinc-500 text-xs">Loading...</p>
                ) : history.length === 0 ? (
                  <p className="text-zinc-500 text-xs">No improvements yet</p>
                ) : history.map(h => (
                  <div key={h.id} className="bg-zinc-800/50 rounded-lg p-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-zinc-400">{h.improvement_type}</span>
                      <span className="text-zinc-500">{new Date(h.created_at).toLocaleDateString()}</span>
                    </div>
                    {h.score_after && <span className="text-emerald-400">Score: {h.score_after}</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
