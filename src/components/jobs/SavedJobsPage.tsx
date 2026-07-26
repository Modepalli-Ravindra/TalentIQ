import React, { useState, useEffect, useCallback } from 'react';
import { Bookmark, BookmarkCheck, Trash2, Briefcase, ExternalLink, Clock } from 'lucide-react';
import { savedJobsApi, ExternalJob } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { EmptyState } from '../ui/EmptyState';
import { JobCardSkeleton } from '../ui/Skeleton';
import toast from 'react-hot-toast';

interface SavedJobEntry {
  id: string;
  job_id?: string;
  external_job_id?: string;
  job_type: string;
  notes?: string;
  created_at: string;
}

interface SavedJobsPageProps {
  onJobSelect?: (job: ExternalJob) => void;
}

export const SavedJobsPage: React.FC<SavedJobsPageProps> = ({ onJobSelect }) => {
  const { user } = useAuth();
  const [savedJobs, setSavedJobs] = useState<SavedJobEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const loadSavedJobs = useCallback(async () => {
    try {
      setLoading(true);
      const response = await savedJobsApi.list();
      if (response.success) {
        setSavedJobs(response.data);
      }
    } catch (error) {
      console.error('Failed to load saved jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) loadSavedJobs();
  }, [user, loadSavedJobs]);

  const handleRemove = async (savedJobId: string) => {
    try {
      const response = await savedJobsApi.remove(savedJobId);
      if (response.success) {
        setSavedJobs(prev => prev.filter(j => j.id !== savedJobId));
        toast.success('Job removed from saved list');
      }
    } catch (error) {
      toast.error('Failed to remove job');
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <JobCardSkeleton count={3} />
      </div>
    );
  }

  if (savedJobs.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <EmptyState
          type="saved"
          action={{ label: 'Browse Jobs', onClick: () => window.location.reload() }}
        />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Saved Jobs</h1>
          <p className="text-xs text-gray-400 mt-1">{savedJobs.length} jobs saved</p>
        </div>
        <Bookmark className="w-6 h-6 text-blue-400" />
      </div>

      <div className="space-y-3">
        {savedJobs.map(entry => (
          <div
            key={entry.id}
            className="p-4 bg-[#18181B] border border-[#27272A] rounded-2xl hover:border-blue-500/30 transition-all group"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                    {entry.job_type}
                  </span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Saved {new Date(entry.created_at).toLocaleDateString()}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white">{entry.external_job_id || entry.job_id || 'Unknown Job'}</h3>
                {entry.notes && <p className="text-xs text-gray-400 mt-1">{entry.notes}</p>}
              </div>

              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {entry.external_job_id && (
                  <button
                    onClick={() => {/* Would open job details */}}
                    className="p-1.5 text-gray-400 hover:text-blue-400 rounded-lg hover:bg-[#27272A] transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </button>
                )}
                <button
                  onClick={() => handleRemove(entry.id)}
                  className="p-1.5 text-gray-400 hover:text-rose-400 rounded-lg hover:bg-[#27272A] transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
