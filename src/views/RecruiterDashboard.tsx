import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Plus, Users, Clock, TrendingUp, Filter, AlertTriangle, Mail, BarChart3, ArrowUpRight, Eye } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';
import { CandidateApplication } from '../types';
import { KanbanBoard } from '../components/recruiter/KanbanBoard';
import { AIFollowUpModal } from '../components/recruiter/AIFollowUpModal';
import { AIBiasOptimizerModal } from '../components/recruiter/AIBiasOptimizerModal';
import { applicationService, analyticsService, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { MOCK_APPLICATIONS } from '../data/mockData';

interface RecruiterDashboardProps {
  applications: CandidateApplication[];
}

export const RecruiterDashboard: React.FC<RecruiterDashboardProps> = ({ applications: propApps }) => {
  const { user } = useAuth();
  const [selectedAppForFollowUp, setSelectedAppForFollowUp] = useState<CandidateApplication | null>(null);
  const [showBiasOptimizer, setShowBiasOptimizer] = useState(false);
  const [stats, setStats] = useState({ totalJobs: 0, totalApplications: 0, activeJobs: 0, avgMatchScore: 0, byStatus: {} as Record<string, number> });
  const [applications, setApplications] = useState<CandidateApplication[]>(propApps);

  const loadStats = useCallback(async () => {
    if (!user) return;
    if (isSupabaseConfigured()) {
      const { data } = await analyticsService.getRecruiterStats(user.id);
      if (data) setStats(data);
    } else {
      setStats({
        totalJobs: 4,
        totalApplications: 4,
        activeJobs: 4,
        avgMatchScore: 89,
        byStatus: { applied: 1, screening: 1, assessment: 1, interview: 1 },
      });
    }
  }, [user]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const funnelData = [
    { stage: 'Applied', count: stats.byStatus?.applied || 42 },
    { stage: 'Screening', count: stats.byStatus?.screening || 28 },
    { stage: 'Assessment', count: stats.byStatus?.assessment || 18 },
    { stage: 'Interview', count: stats.byStatus?.interview || 12 },
    { stage: 'Offer', count: stats.byStatus?.offer || 5 },
  ];

  const weeklyTrend = [
    { day: 'Mon', applications: 12 },
    { day: 'Tue', applications: 19 },
    { day: 'Wed', applications: 15 },
    { day: 'Thu', applications: 22 },
    { day: 'Fri', applications: 18 },
    { day: 'Sat', applications: 8 },
    { day: 'Sun', applications: 5 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
      {/* Top Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-purple-950/30 via-[#18181B] to-blue-950/30 border border-[#27272A] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-300 text-xs font-mono font-semibold mb-2">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> Recruiter Copilot Active
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white">
            Recruitment Command Workstation
          </h1>
          <p className="text-xs text-gray-400 max-w-lg mt-1">
            Manage your candidate funnel with automated AI rankings, smart follow-up generators, and bias optimization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setShowBiasOptimizer(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#111827] border border-[#27272A] hover:border-purple-500/50 text-purple-300 rounded-xl text-xs font-semibold transition-all"
          >
            <Sparkles className="w-4 h-4 text-purple-400" /> AI Bias Optimizer
          </button>
          <button
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/20 transition-all"
          >
            <Plus className="w-4 h-4" /> Create AI Job Posting
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Candidates', val: String(stats.totalApplications || 248), change: '+14%', icon: Users, color: 'text-blue-400' },
          { label: 'Active Jobs', val: String(stats.activeJobs || 12), change: '+3', icon: BarChart3, color: 'text-emerald-400' },
          { label: 'AI Match Accuracy', val: `${stats.avgMatchScore || 94}%`, change: '+3.2%', icon: Sparkles, color: 'text-purple-400' },
          { label: 'Avg Time to Hire', val: '9.2 Days', change: '-4.5 days', icon: Clock, color: 'text-amber-400' },
        ].map((kpi, i) => (
          <div key={i} className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>{kpi.label}</span>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div className="text-2xl font-extrabold text-white">{kpi.val}</div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center gap-1 font-semibold">
              ↑ {kpi.change} vs last month
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Hiring Funnel */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Hiring Funnel
            </h3>
          </div>
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <XAxis type="number" stroke="#64748B" fontSize={11} />
                <YAxis dataKey="stage" type="category" stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#FFF', borderRadius: '12px' }}
                />
                <Bar dataKey="count" fill="#3B82F6" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Weekly Trend */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-purple-400" /> Weekly Application Trend
            </h3>
          </div>
          <div className="h-56 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={weeklyTrend} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorApps" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#FFF', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="applications" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorApps)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Kanban Pipeline */}
      <KanbanBoard
        applications={applications}
        onOpenFollowUp={(app) => setSelectedAppForFollowUp(app)}
      />

      {/* Modals */}
      {selectedAppForFollowUp && (
        <AIFollowUpModal
          application={selectedAppForFollowUp}
          onClose={() => setSelectedAppForFollowUp(null)}
        />
      )}
      {showBiasOptimizer && (
        <AIBiasOptimizerModal onClose={() => setShowBiasOptimizer(false)} />
      )}
    </div>
  );
};
