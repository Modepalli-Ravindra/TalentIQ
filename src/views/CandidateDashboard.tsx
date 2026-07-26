import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, User, FileText, CheckCircle2, Clock, BookOpen, ChevronRight, Award, Zap, BarChart3, Calendar, TrendingUp, Target, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { CandidateProfile, CandidateApplication } from '../types';
import { analyticsService, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface CandidateDashboardProps {
  candidate: CandidateProfile;
  applications: CandidateApplication[];
  onExploreJobs: () => void;
  onNavigate?: (view: string) => void;
}

export const CandidateDashboard: React.FC<CandidateDashboardProps> = ({
  candidate,
  applications,
  onExploreJobs,
  onNavigate,
}) => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ totalApplied: 0, avgMatchScore: 0, interviews: 0, offers: 0 });

  const loadStats = useCallback(async () => {
    if (!user) return;
    if (isSupabaseConfigured()) {
      const { data } = await analyticsService.getCandidateStats(user.id);
      if (data) setStats(data);
    } else {
      setStats({
        totalApplied: applications.length,
        avgMatchScore: applications.length ? Math.round(applications.reduce((s, a) => s + a.matchScore, 0) / applications.length) : 0,
        interviews: applications.filter(a => a.stage === 'Interview').length,
        offers: applications.filter(a => a.stage === 'Offer').length,
      });
    }
  }, [user, applications]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const profileCompletionItems = [
    { label: 'Headline', done: true },
    { label: 'Skills', done: candidate.parsedSkills.length > 0 },
    { label: 'Experience', done: candidate.experienceYears > 0 },
    { label: 'Resume', done: true },
  ];
  const profilePct = Math.round((profileCompletionItems.filter(i => i.done).length / profileCompletionItems.length) * 100);

  const statusBreakdown = [
    { status: 'Applied', count: applications.filter(a => a.stage === 'Applied').length },
    { status: 'Screening', count: applications.filter(a => a.stage === 'Screening').length },
    { status: 'Assessment', count: applications.filter(a => a.stage === 'AI Assessment').length },
    { status: 'Interview', count: applications.filter(a => a.stage === 'Interview').length },
    { status: 'Offer', count: applications.filter(a => a.stage === 'Offer').length },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
      {/* Profile Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#18181B] via-blue-950/20 to-[#18181B] border border-[#27272A] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <img
            src={candidate.avatar}
            alt={candidate.name}
            className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-xl"
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-white">{candidate.name}</h1>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-medium">
                Verified Candidate
              </span>
            </div>
            <p className="text-xs text-gray-400 font-medium mt-0.5">{candidate.title}</p>
            <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 font-mono">
              <span>{candidate.experienceYears} Years Exp</span>
              <span>•</span>
              <span>{stats.totalApplied || candidate.appliedJobsCount} Applied Positions</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Profile Completion */}
          <button
            onClick={() => onNavigate?.('candidate-profile')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-[#111827] border border-[#27272A] min-w-[200px] hover:border-blue-500/40 transition-all cursor-pointer"
          >
            <div className="relative flex items-center justify-center w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 36 36">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#27272A" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#3B82F6" strokeWidth="3" strokeDasharray={`${profilePct}, 100`} />
              </svg>
              <span className="absolute text-sm font-bold text-white">{profilePct}%</span>
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-gray-400 font-semibold">Profile</div>
              <div className="text-xs text-blue-400 font-bold mt-0.5">Complete your profile</div>
            </div>
          </button>

          {/* Resume Score */}
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-[#111827] border border-[#27272A] min-w-[200px]">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-full border-2 border-emerald-500/40 bg-emerald-500/10">
              <span className="text-lg font-extrabold text-emerald-400">{candidate.resumeScore}</span>
            </div>
            <div>
              <div className="text-xs font-mono uppercase text-gray-400 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-purple-400" /> AI Resume Score
              </div>
              <div className="text-xs text-emerald-400 font-bold mt-0.5">Top 5% Talent Pool</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: 'Total Applied', val: stats.totalApplied || applications.length, icon: Target, color: 'text-blue-400' },
          { label: 'Avg Match', val: `${stats.avgMatchScore || candidate.resumeScore}%`, icon: Sparkles, color: 'text-purple-400' },
          { label: 'Interviews', val: stats.interviews || applications.filter(a => a.stage === 'Interview').length, icon: Calendar, color: 'text-emerald-400' },
          { label: 'Offers', val: stats.offers || applications.filter(a => a.stage === 'Offer').length, icon: Award, color: 'text-amber-400' },
        ].map((stat, i) => (
          <div key={i} className="p-4 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-1">
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
            <div className="text-xl font-extrabold text-white">{stat.val}</div>
            <div className="text-[10px] text-gray-400 font-mono">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Skill Heatmap */}
          <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-blue-400" /> AI Technical Skill Heatmap
              </h3>
              <span className="text-[10px] font-mono text-gray-500">Parsed from Github</span>
            </div>
            <div className="space-y-3.5">
              {candidate.matchHeatmap.map((item) => (
                <div key={item.skill} className="space-y-1 text-xs">
                  <div className="flex justify-between font-semibold">
                    <span className="text-gray-300">{item.skill}</span>
                    <span className="text-blue-400 font-mono">{item.mastery}%</span>
                  </div>
                  <div className="w-full h-2 bg-[#111827] rounded-full overflow-hidden border border-[#27272A]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        item.mastery >= 90 ? 'bg-gradient-to-r from-blue-500 to-emerald-400'
                          : item.mastery >= 75 ? 'bg-blue-500' : 'bg-amber-500'
                      }`}
                      style={{ width: `${item.mastery}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Application Status Chart */}
          <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-purple-400" /> Application Status
            </h3>
            <div className="h-40 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusBreakdown} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                  <XAxis dataKey="status" stroke="#64748B" fontSize={9} />
                  <YAxis stroke="#94A3B8" fontSize={10} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#FFF', borderRadius: '8px', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Skill Gap Recommendations */}
          <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-purple-400" /> AI Skill Gap Recommendations
            </h3>
            <div className="space-y-3">
              {[
                { title: 'Advanced WebAssembly Runtimes', time: '45 mins', benefit: '+6% Match Score' },
                { title: 'PostgreSQL pgvector Tuning', time: '1 hour', benefit: '+8% Match Score' },
              ].map((rec, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-[#111827] border border-[#27272A] space-y-1.5 text-xs">
                  <div className="font-semibold text-white">{rec.title}</div>
                  <div className="text-[11px] text-purple-300 font-mono">{rec.benefit}</div>
                  <div className="flex items-center justify-between pt-1 text-[10px] text-gray-400">
                    <span>Est: {rec.time}</span>
                    <button className="text-blue-400 hover:underline font-semibold flex items-center gap-0.5">
                      Launch <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Applications Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] space-y-6">
            <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
              <div>
                <h2 className="text-base font-bold text-white">Active Applications Timeline</h2>
                <p className="text-xs text-gray-400">Live recruitment progress & interview schedules</p>
              </div>
              <button
                onClick={onExploreJobs}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
              >
                Find More Jobs
              </button>
            </div>

            <div className="space-y-4">
              {applications.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <Target className="w-10 h-10 text-gray-600 mx-auto" />
                  <p className="text-sm text-white font-semibold">No applications yet</p>
                  <p className="text-xs text-gray-400">Start exploring jobs to build your pipeline</p>
                  <button
                    onClick={onExploreJobs}
                    className="mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
                  >
                    Browse Jobs
                  </button>
                </div>
              ) : (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className="p-5 rounded-2xl bg-[#111827] border border-[#27272A] hover:border-blue-500/40 transition-all space-y-4"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <img
                          src={app.companyLogo}
                          alt={app.company}
                          className="w-10 h-10 rounded-xl object-cover"
                        />
                        <div>
                          <h3 className="text-sm font-bold text-white">{app.jobTitle}</h3>
                          <span className="text-xs text-gray-400">{app.company}</span>
                        </div>
                      </div>
                      <span className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-xs font-mono font-semibold">
                        {app.stage} Stage
                      </span>
                    </div>

                    {/* Progress Tracker */}
                    <div className="grid grid-cols-5 gap-1 pt-2">
                      {['Applied', 'Screening', 'AI Assessment', 'Interview', 'Offer'].map((step, idx) => {
                        const currentIdx = ['Applied', 'Screening', 'AI Assessment', 'Interview', 'Offer'].indexOf(app.stage);
                        const isComplete = idx <= currentIdx;
                        return (
                          <div key={step} className="space-y-1">
                            <div className={`h-1.5 rounded-full transition-all ${isComplete ? 'bg-blue-500' : 'bg-[#27272A]'}`} />
                            <span className={`text-[9px] font-mono block text-center truncate ${isComplete ? 'text-gray-200 font-semibold' : 'text-gray-600'}`}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>

                    {app.nextStep && (
                      <div className="p-3 rounded-xl bg-blue-600/10 border border-blue-500/30 text-xs text-blue-300 flex items-center justify-between">
                        <span className="flex items-center gap-1.5 font-medium">
                          <Clock className="w-3.5 h-3.5 text-blue-400" />
                          Next Action: {app.nextStep}
                        </span>
                        <span className="text-[10px] font-mono text-blue-400/60">{app.matchScore}% match</span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
