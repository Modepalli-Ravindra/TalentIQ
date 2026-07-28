import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { interviewsApi, jobsApi, type Interview, type ExternalJob } from '../../lib/api';
import { JobCardSkeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';
import { Calendar, Clock, Video, Phone, MapPin, Star, ChevronRight, Plus, X, Loader2, Check } from 'lucide-react';

interface Props {
  onJobSelect: (job: any) => void;
}

const typeIcons: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />,
  phone: <Phone className="w-4 h-4" />,
  onsite: <MapPin className="w-4 h-4" />,
  technical: <Star className="w-4 h-4" />,
  behavioral: <Star className="w-4 h-4" />,
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
  const [selected, setSelected] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [feedbackInterview, setFeedbackInterview] = useState<string | null>(null);

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

  const handleConfirm = async (id: string) => {
    try {
      await interviewsApi.update(id, { status: 'confirmed' });
      toast.success('Interview confirmed');
      fetchInterviews();
    } catch { toast.error('Failed to confirm'); }
  };

  if (loading) return <JobCardSkeleton count={3} />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Interviews</h1>
          <p className="text-zinc-400 text-sm mt-1">{interviews.length} interviews total</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
          >
            <option value="">All Status</option>
            <option value="scheduled">Scheduled</option>
            <option value="confirmed">Confirmed</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          {(user?.role === 'recruiter' || user?.role === 'admin') && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" /> Schedule Interview
            </button>
          )}
        </div>
      </div>

      {interviews.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Calendar className="w-16 h-16 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No interviews yet</h3>
          <p className="text-zinc-400 text-sm">
            {user?.role === 'recruiter' ? 'Schedule your first interview to get started.' : 'Your scheduled interviews will appear here.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {interviews.map((interview) => {
            const isExpanded = selected === interview.id;
            return (
              <div
                key={interview.id}
                className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all"
              >
                <div
                  onClick={() => setSelected(isExpanded ? null : interview.id)}
                  className="p-4 cursor-pointer"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-medium">{interview.title}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${statusColors[interview.status] || ''}`}>
                          {interview.status}
                        </span>
                        <span className="px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400 border border-zinc-700">
                          {interview.interview_type}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-zinc-400 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(interview.scheduled_at).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {new Date(interview.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {' '}({interview.duration_minutes}min)
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-zinc-500 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-4 pb-4 pt-2 border-t border-zinc-800 space-y-3">
                    {interview.description && (
                      <p className="text-zinc-400 text-sm">{interview.description}</p>
                    )}
                    {interview.notes && (
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Notes</p>
                        <p className="text-sm text-zinc-300">{interview.notes}</p>
                      </div>
                    )}
                    {interview.meeting_url && (
                      <a
                        href={interview.meeting_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-sm hover:bg-blue-600/30 transition-colors"
                      >
                        <Video className="w-4 h-4" /> Join Meeting
                      </a>
                    )}
                    {interview.feedback && (
                      <div className="bg-zinc-800/50 rounded-lg p-3">
                        <p className="text-xs text-zinc-500 mb-1">Feedback</p>
                        <p className="text-sm text-zinc-300">{interview.feedback}</p>
                        {interview.rating && (
                          <div className="flex items-center gap-1 mt-2">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star key={i} className={`w-4 h-4 ${i < interview.rating! ? 'text-amber-400 fill-amber-400' : 'text-zinc-600'}`} />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                    <div className="flex gap-2 pt-1">
                      {interview.status === 'scheduled' && interview.recruiter_id !== user?.id && (
                        <button onClick={() => handleConfirm(interview.id)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs hover:bg-emerald-500/30 transition-colors">
                          <Check className="w-3.5 h-3.5" /> Confirm
                        </button>
                      )}
                      {interview.status !== 'cancelled' && interview.status !== 'completed' && interview.recruiter_id === user?.id && (
                        <button onClick={() => setFeedbackInterview(feedbackInterview === interview.id ? null : interview.id)}
                          className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-lg text-xs hover:bg-purple-500/30 transition-colors">
                          Submit Feedback
                        </button>
                      )}
                      {interview.status !== 'cancelled' && interview.status !== 'completed' && (
                        <button onClick={() => handleCancel(interview.id)}
                          className="px-3 py-1.5 bg-red-500/20 text-red-400 rounded-lg text-xs hover:bg-red-500/30 transition-colors">
                          Cancel
                        </button>
                      )}
                    </div>
                    {feedbackInterview === interview.id && (
                      <FeedbackForm
                        interviewId={interview.id}
                        onDone={() => { setFeedbackInterview(null); fetchInterviews(); }}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateInterviewModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); fetchInterviews(); }}
        />
      )}
    </div>
  );
}

function FeedbackForm({ interviewId, onDone }: { interviewId: string; onDone: () => void }) {
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState(3);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!feedback.trim()) { toast.error('Please enter feedback'); return; }
    setSubmitting(true);
    try {
      await interviewsApi.feedback(interviewId, feedback, rating);
      toast.success('Feedback submitted');
      onDone();
    } catch { toast.error('Failed to submit feedback'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="bg-zinc-800/50 rounded-lg p-4 space-y-3">
      <textarea
        value={feedback}
        onChange={(e) => setFeedback(e.target.value)}
        placeholder="Enter your feedback..."
        className="w-full h-24 bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none"
      />
      <div className="flex items-center gap-2">
        <span className="text-xs text-zinc-400">Rating:</span>
        {Array.from({ length: 5 }).map((_, i) => (
          <button key={i} onClick={() => setRating(i + 1)}>
            <Star className={`w-5 h-5 ${i < rating ? 'text-amber-400 fill-amber-400' : 'text-zinc-600 hover:text-zinc-500'} transition-colors`} />
          </button>
        ))}
      </div>
      <button onClick={handleSubmit} disabled={submitting}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
        Submit
      </button>
    </div>
  );
}

function CreateInterviewModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [candidateId, setCandidateId] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [duration, setDuration] = useState(30);
  const [type, setType] = useState('video');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !candidateId.trim() || !scheduledAt) {
      toast.error('Title, candidate ID, and date are required');
      return;
    }
    setSubmitting(true);
    try {
      await interviewsApi.create({
        job_id: '00000000-0000-0000-0000-000000000000',
        candidate_id: candidateId,
        title,
        description: description || undefined,
        scheduled_at: new Date(scheduledAt).toISOString(),
        duration_minutes: duration,
        interview_type: type,
        meeting_url: meetingUrl || undefined,
        notes: notes || undefined,
      });
      toast.success('Interview scheduled!');
      onCreated();
    } catch (err: any) {
      toast.error(err?.message?.includes('409') ? 'Scheduling conflict' : 'Failed to create');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Schedule Interview</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Technical Interview"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Description</label>
            <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Brief description"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Candidate ID *</label>
            <input value={candidateId} onChange={(e) => setCandidateId(e.target.value)} placeholder="Candidate UUID"
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Date & Time *</label>
              <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-xs text-zinc-500 mb-1">Duration (min)</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
                <option value={15}>15 min</option>
                <option value={30}>30 min</option>
                <option value={45}>45 min</option>
                <option value={60}>60 min</option>
                <option value={90}>90 min</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Interview Type</label>
            <div className="flex gap-2">
              {['video', 'phone', 'onsite', 'technical', 'behavioral'].map(t => (
                <button key={t} onClick={() => setType(t)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize ${
                    type === t ? 'bg-blue-600/20 border-blue-500 text-blue-300' : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Meeting URL</label>
            <input value={meetingUrl} onChange={(e) => setMeetingUrl(e.target.value)} placeholder="https://meet.google.com/..."
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500" />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1">Notes</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Additional notes..."
              className="w-full h-20 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500 resize-none" />
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg text-sm transition-colors">Cancel</button>
          <button onClick={handleSubmit} disabled={submitting}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors">
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Calendar className="w-4 h-4" />}
            Schedule
          </button>
        </div>
      </div>
    </div>
  );
}
