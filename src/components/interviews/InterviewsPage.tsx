import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { interviewsApi, type Interview } from '../../lib/api';
import { JobCardSkeleton } from '../ui/Skeleton';
import { EmptyState } from '../ui/EmptyState';
import toast from 'react-hot-toast';
import { Calendar, Clock, Video, Phone, MapPin, Star, ChevronRight, Plus, Filter } from 'lucide-react';

interface Props {
  onJobSelect: (job: any) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  onsite: <MapPin className="w-4 h-4" />,
  technical: <Star className="w-4 h-4" />,
};

const statusColors: Record<string, string> = {
  scheduled: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  confirmed: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  cancelled: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  rescheduled: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

export default function InterviewsPage({ onJobSelect }: Props) {
  const { user } = useAuth();
  const [interviews, setInterviews] = useState<Interview[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('');
  const [selected, setSelected] = useState<Interview | null>(null);

  const fetchInterviews = useCallback(async () => {
    try {
      setLoading(true);
      const data = await interviewsApi.list(filter || undefined);
      setInterviews(data);
    } catch (err) {
      toast.error('Failed to load interviews');
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => { fetchInterviews(); }, [fetchInterviews]);

  const handleCancel = async (id: string) => {
    if (!confirm('Cancel this interview?')) return;
    try {
      await interviewsApi.cancel(id);
      toast.success('Interview cancelled');
      fetchInterviews();
    } catch { toast.error('Failed to cancel'); }
  };

  if (loading) return <JobCardSkeleton count={3} />;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Interviews</h1>
          <p className="text-zinc-400 text-sm mt-1">{interviews.length} interviews</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {interviews.length === 0 ? (
        <EmptyState type="generic" title="No interviews yet" description="Your scheduled interviews will appear here." />
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => (
            <div
              key={interview.id}
              onClick={() => setSelected(selected?.id === interview.id ? null : interview)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all cursor-pointer"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-white font-medium">{interview.title}</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[interview.status] || ''}`}>
                      {interview.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-zinc-400">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" />
                      {new Date(interview.scheduled_at).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {new Date(interview.scheduled_at).toLocaleTimeString()} ({interview.duration_minutes}min)
                    </span>
                    <span className="flex items-center gap-1">
                      {typeIcons[interview.interview_type] || <Video className="w-3.5 h-3.5" />}
                      {interview.interview_type}
                    </span>
                  </div>
                  {selected?.id === interview.id && (
                    <div className="mt-3 pt-3 border-t border-zinc-800 space-y-2">
                      {interview.meeting_url && (
                        <a href={interview.meeting_url} target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-blue-400 hover:text-blue-300 text-sm">
                          Join Meeting <ChevronRight className="w-3 h-3" />
                        </a>
                      )}
                      {interview.notes && <p className="text-zinc-400 text-sm">{interview.notes}</p>}
                      {interview.feedback && (
                        <div className="bg-zinc-800/50 rounded-lg p-3">
                          <p className="text-zinc-300 text-sm">{interview.feedback}</p>
                          {interview.rating && (
                            <div className="flex items-center gap-1 mt-1">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} className={`w-4 h-4 ${i < interview.rating! ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      <div className="flex gap-2">
                        {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                          <button onClick={(e) => { e.stopPropagation(); handleCancel(interview.id); }}
                            className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30">
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <ChevronRight className={`w-5 h-5 text-zinc-500 transition-transform ${selected?.id === interview.id ? 'rotate-90' : ''}`} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
