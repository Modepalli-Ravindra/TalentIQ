import React, { useEffect, useState } from 'react';
import { Search, Briefcase, User, BarChart3, Sparkles, Command, X } from 'lucide-react';
import { UserRole } from '../../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRole: (role: UserRole) => void;
  onNavigateView: (view: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectRole,
  onNavigateView
}) => {
  const [search, setSearch] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // Open triggered by parent state
        }
      }
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    { id: 'jobs', label: 'Explore Developer Jobs', category: 'Navigation', icon: Briefcase, action: () => { onNavigateView('jobs'); onClose(); } },
    { id: 'candidate', label: 'Candidate Dashboard (AI Fit Heatmap)', category: 'Views', icon: User, action: () => { onSelectRole('candidate'); onNavigateView('candidate-dashboard'); onClose(); } },
    { id: 'recruiter', label: 'Recruiter Dashboard (Kanban & AI Ranking)', category: 'Views', icon: Sparkles, action: () => { onSelectRole('recruiter'); onNavigateView('recruiter-dashboard'); onClose(); } },
    { id: 'analytics', label: 'Hiring Analytics & Funnel Metrics', category: 'Analytics', icon: BarChart3, action: () => { onNavigateView('analytics'); onClose(); } },
    { id: 'admin', label: 'Admin & Verification Console', category: 'Views', icon: Command, action: () => { onSelectRole('admin'); onNavigateView('admin-dashboard'); onClose(); } },
  ];

  const filteredActions = actions.filter(a => a.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden glass-card">
        {/* Command Search Input */}
        <div className="flex items-center px-4 py-3.5 border-b border-[#27272A] gap-3">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Type a command or search everywhere... (e.g. Next.js, Candidate, Analytics)"
            className="w-full bg-transparent text-white placeholder-gray-500 focus:outline-none text-sm font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-white/5">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action List */}
        <div className="max-h-80 overflow-y-auto p-2">
          {filteredActions.length === 0 ? (
            <div className="py-8 text-center text-sm text-gray-400">
              No command matching "<span className="text-gray-200">{search}</span>"
            </div>
          ) : (
            filteredActions.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={item.action}
                  className="w-full flex items-center justify-between px-3.5 py-3 rounded-xl hover:bg-blue-600/10 hover:border hover:border-blue-500/30 text-left transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-white/5 text-blue-400 group-hover:bg-blue-500/20 group-hover:text-blue-300">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white group-hover:text-blue-300">
                        {item.label}
                      </div>
                      <div className="text-xs text-gray-500">{item.category}</div>
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 bg-white/5 px-2 py-1 rounded font-mono group-hover:bg-blue-500/20 group-hover:text-blue-300">
                    Jump ↵
                  </span>
                </button>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="flex items-center justify-between px-4 py-2.5 bg-[#111827] border-t border-[#27272A] text-xs text-gray-400">
          <div className="flex items-center gap-2">
            <kbd className="px-1.5 py-0.5 bg-[#27272A] text-gray-300 rounded font-mono text-[10px]">↑↓</kbd> navigate
            <kbd className="px-1.5 py-0.5 bg-[#27272A] text-gray-300 rounded font-mono text-[10px]">ESC</kbd> close
          </div>
          <div className="flex items-center gap-1 text-blue-400 font-medium">
            <Sparkles className="w-3 h-3" /> TalentIQ AI Copilot
          </div>
        </div>
      </div>
    </div>
  );
};
