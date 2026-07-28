import React from 'react';
import { Search, Briefcase, FileText, Users, Inbox, Bookmark, AlertCircle } from 'lucide-react';

interface EmptyStateProps {
  type?: 'search' | 'jobs' | 'applications' | 'candidates' | 'saved' | 'generic';
  title?: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

const emptyConfigs = {
  search: {
    icon: <Search className="w-12 h-12" />,
    title: 'No results found',
    description: 'Try adjusting your search terms or filters to find what you are looking for.',
  },
  jobs: {
    icon: <Briefcase className="w-12 h-12" />,
    title: 'No jobs available',
    description: 'There are no jobs matching your criteria at the moment. Check back later.',
  },
  applications: {
    icon: <FileText className="w-12 h-12" />,
    title: 'No applications yet',
    description: 'Start exploring jobs and apply to positions that match your skills.',
  },
  candidates: {
    icon: <Users className="w-12 h-12" />,
    title: 'No candidates found',
    description: 'No candidates match your search criteria. Try broadening your search.',
  },
  saved: {
    icon: <Bookmark className="w-12 h-12" />,
    title: 'No saved jobs',
    description: 'Save jobs you are interested in to review them later.',
  },
  generic: {
    icon: <Inbox className="w-12 h-12" />,
    title: 'Nothing here yet',
    description: 'This section is empty. Start by exploring the platform.',
  },
};

export const EmptyState: React.FC<EmptyStateProps> = ({ type = 'generic', title, description, action }) => {
  const config = emptyConfigs[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="w-20 h-20 rounded-3xl bg-[#18181B] border border-[#27272A] flex items-center justify-center text-gray-600 mb-6">
        {config.icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title || config.title}</h3>
      <p className="text-sm text-gray-400 text-center max-w-sm mb-6">{description || config.description}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {action.label}
        </button>
      )}
    </div>
  );
};

export const OfflineBanner: React.FC<{ isOnline: boolean }> = ({ isOnline }) => {
  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-amber-600 text-white text-center py-2 px-4 text-sm font-medium flex items-center justify-center gap-2">
      <AlertCircle className="w-4 h-4" />
      You are offline. Some features may be unavailable.
    </div>
  );
};
