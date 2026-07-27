import React, { useState, useCallback, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resumeApi, type ResumeImprovement } from '../../lib/api';
import toast from 'react-hot-toast';
import { Sparkles, ArrowRight, Check, RotateCcw, Loader2, History, Copy, FileText, Target, Zap, Shield, Type, Layout } from 'lucide-react';

const improvementTypes = [
  { value: 'full', label: 'Full Improvement', desc: 'Complete resume overhaul with all optimizations', icon: Sparkles, color: 'from-blue-500 to-purple-600' },
  { value: 'rewrite', label: 'Professional Rewrite', desc: 'Rewrite with action verbs and quantified results', icon: FileText, color: 'from-emerald-500 to-teal-600' },
  { value: 'enhance', label: 'Enhance Details', desc: 'Add more detail, power words, and achievements', icon: Zap, color: 'from-amber-500 to-orange-600' },
  { value: 'ats_optimize', label: 'ATS Optimize', desc: 'Optimize for Applicant Tracking Systems', icon: Shield, color: 'from-blue-500 to-cyan-600' },
  { value: 'keyword_boost', label: 'Keyword Boost', desc: 'Target keywords from a specific job description', icon: Target, color: 'from-rose-500 to-pink-600' },
  { value: 'format', label: 'Format & Structure', desc: 'Improve readability and professional layout', icon: Layout, color: 'from-violet-500 to-indigo-600' },
];

export default function ResumeImprovementPage() {
  const { user } = useAuth();
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [improvementType, setImprovementType] = useState('full');
  const [improving, setImproving] = useState(false);
  const [result, setResult] = useState<ResumeImprovement | null>(null);
  const [history, setHistory] = useState<ResumeImprovement[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [activeTab, setActiveTab] = useState<'improved' | 'original'>('improved');

  const fetchHistory = useCallback(async () => {
    try {
      const data = await resumeApi.getHistory();
      setHistory(data);
    } catch { /* silent */ }
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
      setActiveTab('improved');
      toast.success('Resume improved successfully!');
      fetchHistory();
    } catch {
      toast.error('Failed to improve resume. Please try again.');
    } finally { setImproving(false); }
  };

  const handleCopy = () => {
    if (!result) return;
    navigator.clipboard.writeText(result.improved_text);
    toast.success('Copied to clipboard!');
  };

  const handleUseAsInput = () => {
    if (!result) return;
    setResumeText(result.improved_text);
    setResult(null);
    setActiveTab('improved');
    toast.success('Improved text loaded as input');
  };

  const parsedSuggestions = result?.suggestions
    ? (typeof result.suggestions === 'string' ? JSON.parse(result.suggestions) : result.suggestions)
    : [];

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-8">
      {/* Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/40 via-blue-950/30 to-[#18181B] border border-purple-500/30 relative overflow-hidden">
        <div className="space-y-2 z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold">
            <Sparkles className="w-3.5 h-3.5" /> AI Resume Engine
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">AI Resume Improvement</h1>
          <p className="text-xs text-gray-400 max-w-xl">Enhance your resume with AI-powered suggestions tailored to your target role</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Input */}
        <div className="space-y-4">
          {/* Resume Text */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200">Your Resume</label>
              <span className="text-xs text-zinc-500">{wordCount(resumeText)} words</span>
            </div>
            <textarea
              value={resumeText}
              onChange={(e) => setResumeText(e.target.value)}
              placeholder={"Paste your resume here...\n\nExample:\nJohn Doe\nSoftware Engineer\n\nExperience:\n- Built scalable React applications serving 100K+ users\n- Led team of 5 engineers on microservices migration\n\nSkills: React, TypeScript, Python, AWS"}
              className="w-full h-72 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none leading-relaxed"
            />
          </div>

          {/* Improvement Type */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <label className="text-sm font-semibold text-zinc-200">Improvement Type</label>
            <div className="grid grid-cols-2 gap-2">
              {improvementTypes.map(t => {
                const Icon = t.icon;
                const isActive = improvementType === t.value;
                return (
                  <button
                    key={t.value}
                    onClick={() => setImprovementType(t.value)}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500/40 shadow-lg shadow-blue-500/5'
                        : 'bg-zinc-800/30 border-zinc-700/50 hover:border-zinc-600'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${t.color} flex items-center justify-center`}>
                        <Icon className="w-3.5 h-3.5 text-white" />
                      </div>
                      <span className={`text-xs font-semibold ${isActive ? 'text-blue-300' : 'text-zinc-300'}`}>{t.label}</span>
                    </div>
                    <p className="text-[10px] text-zinc-500 leading-relaxed pl-8">{t.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Target Job Description */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-zinc-200">Target Job Description</label>
              <span className="text-[10px] text-zinc-600 font-mono">Optional</span>
            </div>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste a job description to tailor your resume with relevant keywords..."
              className="w-full h-28 bg-zinc-800/50 border border-zinc-700/50 rounded-xl px-4 py-3 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-blue-500/50 resize-none"
            />
          </div>

          {/* Improve Button */}
          <button
            onClick={handleImprove}
            disabled={improving || resumeText.trim().length < 50}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition-all shadow-lg shadow-blue-600/20 text-sm"
          >
            {improving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Analyzing & Improving...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Improve Resume
              </>
            )}
          </button>
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {result ? (
            <div className="space-y-4">
              {/* Score Cards */}
              {(result.score_before || result.score_after) && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <div className="text-center flex-1">
                      <p className="text-4xl font-bold text-zinc-400">{result.score_before || '—'}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">Before</p>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-zinc-500 rounded-full" style={{ width: `${result.score_before || 0}%` }} />
                      </div>
                    </div>
                    <div className="px-6">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                        <ArrowRight className="w-6 h-6 text-white" />
                      </div>
                    </div>
                    <div className="text-center flex-1">
                      <p className="text-4xl font-bold text-emerald-400">{result.score_after || '—'}</p>
                      <p className="text-xs text-zinc-500 mt-1 font-medium">After</p>
                      <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.score_after || 0}%` }} />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs: Improved / Original */}
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="flex border-b border-zinc-800">
                  <button
                    onClick={() => setActiveTab('improved')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === 'improved' ? 'text-blue-400 border-b-2 border-blue-400 bg-blue-500/5' : 'text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    Improved Version
                  </button>
                  <button
                    onClick={() => setActiveTab('original')}
                    className={`flex-1 px-4 py-3 text-sm font-semibold transition-colors ${
                      activeTab === 'original' ? 'text-zinc-300 border-b-2 border-zinc-400 bg-zinc-800/50' : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Original
                  </button>
                </div>
                <div className="p-4 max-h-[500px] overflow-y-auto">
                  <pre className="text-sm text-zinc-300 whitespace-pre-wrap font-sans leading-relaxed">
                    {activeTab === 'improved' ? result.improved_text : result.original_text}
                  </pre>
                </div>
              </div>

              {/* Suggestions */}
              {parsedSuggestions.length > 0 && (
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
                  <h3 className="text-sm font-semibold text-zinc-200">AI Suggestions</h3>
                  <div className="space-y-2">
                    {parsedSuggestions.map((s: string, i: number) => (
                      <div key={i} className="flex items-start gap-3 bg-zinc-800/50 rounded-xl p-3">
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 text-emerald-400" />
                        </div>
                        <p className="text-sm text-zinc-300 leading-relaxed">{s}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleCopy}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-zinc-700">
                  <Copy className="w-4 h-4" /> Copy Improved
                </button>
                <button onClick={handleUseAsInput}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl text-sm font-medium transition-colors border border-zinc-700">
                  <RotateCcw className="w-4 h-4" /> Re-iterate
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center text-center min-h-[500px]">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20 flex items-center justify-center mb-6">
                <Sparkles className="w-10 h-10 text-purple-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Resume Preview</h3>
              <p className="text-zinc-400 text-sm max-w-sm">
                Paste your resume on the left, select an improvement type, and click Improve to see AI-powered suggestions
              </p>
            </div>
          )}

          {/* History */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-zinc-800/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-500" />
                <span className="text-sm font-medium text-zinc-300">Recent Improvements</span>
                <span className="text-xs text-zinc-600 bg-zinc-800 px-2 py-0.5 rounded-full">{history.length}</span>
              </div>
              <span className="text-xs text-zinc-500">{showHistory ? 'Hide' : 'Show'}</span>
            </button>
            {showHistory && (
              <div className="border-t border-zinc-800 max-h-64 overflow-y-auto">
                {loadingHistory ? (
                  <div className="p-4 text-center"><Loader2 className="w-5 h-5 text-zinc-500 animate-spin mx-auto" /></div>
                ) : history.length === 0 ? (
                  <p className="p-4 text-zinc-600 text-xs text-center">No improvements yet</p>
                ) : history.map(h => (
                  <div key={h.id} className="flex items-center justify-between px-5 py-3 border-b border-zinc-800/50 last:border-0 hover:bg-zinc-800/30 transition-colors">
                    <div>
                      <p className="text-xs font-medium text-zinc-300 capitalize">{h.improvement_type.replace('_', ' ')}</p>
                      <p className="text-[10px] text-zinc-600">{new Date(h.created_at).toLocaleDateString()} &middot; {wordCount(h.original_text)} words</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {h.score_after && (
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          h.score_after >= 70 ? 'bg-emerald-500/20 text-emerald-400' : h.score_after >= 50 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {h.score_after}
                        </span>
                      )}
                      <button
                        onClick={() => { setResumeText(h.improved_text); setResult(null); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                        className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        Reuse
                      </button>
                    </div>
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
