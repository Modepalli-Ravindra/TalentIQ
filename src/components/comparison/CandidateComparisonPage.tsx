import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { comparisonApi, type Comparison, type ComparisonResult } from '../../lib/api';
import { JobCardSkeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';
import { Users, BarChart3, Plus, Trash2, Loader2, ChevronDown, ChevronUp, Star, MapPin, Briefcase } from 'lucide-react';

interface Props {}

export default function CandidateComparisonPage(_props: Props) {
  const { user } = useAuth();
  const [comparisons, setComparisons] = useState<Comparison[]>([]);
  const [loading, setLoading] = useState(true);
  const [candidateIds, setCandidateIds] = useState('');
  const [jobId, setJobId] = useState('');
  const [comparing, setComparing] = useState(false);
  const [result, setResult] = useState<ComparisonResult | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const fetchComparisons = useCallback(async () => {
    try {
      const data = await comparisonApi.list();
      setComparisons(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchComparisons(); }, [fetchComparisons]);

  const handleCompare = async () => {
    const ids = candidateIds.split(',').map(s => s.trim()).filter(Boolean);
    if (ids.length < 2) { toast.error('Enter at least 2 candidate IDs'); return; }
    if (ids.length > 5) { toast.error('Maximum 5 candidates'); return; }

    setComparing(true);
    try {
      const res = await comparisonApi.compare({
        candidate_ids: ids,
        job_id: jobId || undefined,
      });
      setResult(res);
      toast.success('Comparison complete!');
      fetchComparisons();
    } catch { toast.error('Comparison failed'); }
    finally { setComparing(false); }
  };

  const handleDelete = async (id: string) => {
    try {
      await comparisonApi.delete(id);
      setComparisons(prev => prev.filter(c => c.id !== id));
      toast.success('Deleted');
    } catch { toast.error('Failed to delete'); }
  };

  if (loading) return <JobCardSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Candidate Comparison</h1>
        <p className="text-zinc-400 text-sm mt-1">Compare candidates side-by-side</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-medium text-zinc-300">New Comparison</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Candidate IDs (comma-separated)</label>
            <input value={candidateIds} onChange={(e) => setCandidateIds(e.target.value)}
              placeholder="id1, id2, id3"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Job ID (optional)</label>
            <input value={jobId} onChange={(e) => setJobId(e.target.value)}
              placeholder="Job UUID"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
          </div>
        </div>
        <button onClick={handleCompare} disabled={comparing}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
          {comparing ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />}
          Compare
        </button>
      </div>

      {result && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-medium text-zinc-300 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-400" /> Comparison Results
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800">
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">Candidate</th>
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">Skills Coverage</th>
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">Experience</th>
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">Location</th>
                  <th className="text-left py-2 px-3 text-zinc-400 font-medium">Skills</th>
                </tr>
              </thead>
              <tbody>
                {result.candidates.map((c, i) => (
                  <tr key={c.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/30">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
                        <div>
                          <p className="text-white font-medium">{c.name}</p>
                          <p className="text-zinc-500 text-xs">{c.headline || 'No headline'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.skill_coverage}%` }} />
                        </div>
                        <span className="text-zinc-300 text-xs">{c.skill_coverage}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 text-zinc-300">{c.experience_years || 0}y</td>
                    <td className="py-3 px-3 text-zinc-400 text-xs">{c.location || '—'}</td>
                    <td className="py-3 px-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {c.skills.slice(0, 5).map(s => (
                          <span key={s} className="px-1.5 py-0.5 bg-zinc-800 rounded text-xs text-zinc-400">{s}</span>
                        ))}
                        {c.skills.length > 5 && <span className="text-zinc-500 text-xs">+{c.skills.length - 5}</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {comparisons.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-zinc-300">Past Comparisons</h3>
          {comparisons.map(comp => (
            <div key={comp.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-zinc-400 text-xs">{new Date(comp.created_at).toLocaleDateString()}</p>
                  <p className="text-zinc-300 text-sm">{comp.candidate_ids?.length || 0} candidates compared</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setExpanded(expanded === comp.id ? null : comp.id)}
                    className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-xs">
                    {expanded === comp.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                  <button onClick={() => handleDelete(comp.id)}
                    className="px-3 py-1 bg-red-500/20 text-red-400 hover:bg-red-500/30 rounded-lg text-xs">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {expanded === comp.id && comp.comparison_data && (
                <div className="mt-3 pt-3 border-t border-zinc-800">
                  <pre className="text-xs text-zinc-400 whitespace-pre-wrap overflow-x-auto">
                    {JSON.stringify(comp.comparison_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
