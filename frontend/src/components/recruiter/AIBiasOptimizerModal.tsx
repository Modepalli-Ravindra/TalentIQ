import React, { useState } from 'react';
import { X, Sparkles, CheckCircle2, AlertTriangle, RefreshCw, FileText, Loader2 } from 'lucide-react';
import { aiApi, AIBiasResult } from '../../lib/api';

interface AIBiasOptimizerModalProps {
  onClose: () => void;
}

export const AIBiasOptimizerModal: React.FC<AIBiasOptimizerModalProps> = ({ onClose }) => {
  const [jobText, setJobText] = useState(
    "We are seeking a rockstar ninja developer who can grind 80 hours a week to dominate our codebase. Must have 15 years of experience with Next.js 14, PyTorch, and WebAssembly. Highly competitive aggressive environment."
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIBiasResult | null>(null);
  const [error, setError] = useState('');

  const handleAnalyze = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await aiApi.biasAnalysis(jobText);
      setResult(res.data);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Analysis failed';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleApplyFixes = () => {
    if (result?.optimized_description) {
      setJobText(result.optimized_description);
    }
  };

  const severityColor = (s: string) => {
    if (s === 'high') return 'text-rose-400 bg-rose-500/10';
    if (s === 'medium') return 'text-amber-400 bg-amber-500/10';
    return 'text-blue-400 bg-blue-500/10';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden glass-card">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">AI Job Description Optimizer</h2>
              <p className="text-xs text-gray-400">Detect gender bias, readability issues & requirement inflation</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="text-xs font-mono uppercase text-gray-400 block mb-2 font-semibold">
              Job Posting Draft
            </label>
            <textarea
              rows={4}
              value={jobText}
              onChange={(e) => setJobText(e.target.value)}
              className="w-full p-3 bg-[#09090B] border border-[#27272A] rounded-xl text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 leading-relaxed font-mono"
            />
          </div>

          <button
            onClick={handleAnalyze}
            disabled={loading || !jobText.trim()}
            className="flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 w-full justify-center"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Analyzing with Groq AI...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" /> Analyze for Bias & Optimize
              </>
            )}
          </button>

          {error && (
            <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-amber-400 font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  {result.issues.length} Optimization{result.issues.length !== 1 ? 's' : ''} Found
                </span>
                <span className="text-xs text-gray-400">Readability Score: {result.readability_score}/100</span>
              </div>

              {result.summary && (
                <div className="text-xs text-gray-300 bg-[#111827] border border-[#27272A] rounded-xl p-3">
                  {result.summary}
                </div>
              )}

              <div className="space-y-2">
                {result.issues.map((issue, idx) => (
                  <div key={idx} className="p-3 bg-[#111827] border border-[#27272A] rounded-xl text-xs space-y-1">
                    <div className="flex items-center justify-between font-semibold">
                      <span className="text-amber-400">{issue.type}</span>
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded ${severityColor(issue.severity)}`}>
                        {issue.severity.toUpperCase()} Impact
                      </span>
                    </div>
                    <p className="text-gray-400">Detected: <span className="text-white font-mono">{issue.text}</span></p>
                    <p className="text-emerald-400">Suggested: {issue.suggestion}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-[#27272A] bg-[#111827] flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-xs font-semibold text-gray-400 hover:text-white">
            Cancel
          </button>

          <button
            onClick={handleApplyFixes}
            disabled={!result?.optimized_description}
            className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" /> Auto-Apply AI Enhancements
          </button>
        </div>
      </div>
    </div>
  );
};
