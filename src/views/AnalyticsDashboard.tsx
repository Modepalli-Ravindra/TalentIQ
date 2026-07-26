import React from 'react';
import { BarChart3, TrendingUp, Users, Clock, ArrowDownRight, Award, Zap, Download } from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from 'recharts';

export const AnalyticsDashboard: React.FC = () => {
  const funnelData = [
    { stage: 'Applications', count: 1420 },
    { stage: 'AI Match > 80%', count: 680 },
    { stage: 'Screening Call', count: 240 },
    { stage: 'Tech Interview', count: 95 },
    { stage: 'Offer Extended', count: 28 },
    { stage: 'Accepted', count: 25 },
  ];

  const timeToHireData = [
    { month: 'Jan', days: 18 },
    { month: 'Feb', days: 16 },
    { month: 'Mar', days: 14 },
    { month: 'Apr', days: 11 },
    { month: 'May', days: 9.8 },
    { month: 'Jun', days: 9.2 },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-blue-400" /> TalentIQ Business Intelligence
          </div>
          <h1 className="text-2xl font-extrabold text-white">Recruitment Analytics & Funnel Velocity</h1>
          <p className="text-xs text-gray-400">Data-driven insights to eliminate hiring bottlenecks</p>
        </div>

        <button className="flex items-center gap-2 px-4 py-2 bg-[#18181B] border border-[#27272A] hover:border-gray-500 text-gray-200 rounded-xl text-xs font-semibold">
          <Download className="w-4 h-4 text-blue-400" /> Export PDF Report
        </button>
      </div>

      {/* Analytics Grid Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recruitment Funnel Chart */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-400" /> Hiring Conversion Funnel
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">92% Acceptance Rate</span>
          </div>

          <div className="h-64 w-full pt-4">
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

        {/* Time-to-Hire Velocity Trend Chart */}
        <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] glass-card space-y-4">
          <div className="flex items-center justify-between border-b border-[#27272A] pb-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Average Time to Hire (Days)
            </h3>
            <span className="text-[10px] text-emerald-400 font-mono">-48% Velocity Gain</span>
          </div>

          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timeToHireData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorDays" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="month" stroke="#64748B" fontSize={11} />
                <YAxis stroke="#94A3B8" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181B', borderColor: '#27272A', color: '#FFF', borderRadius: '12px' }}
                />
                <Area type="monotone" dataKey="days" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#colorDays)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
