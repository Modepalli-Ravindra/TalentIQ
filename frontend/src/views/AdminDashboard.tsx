import React from 'react';
import { ShieldCheck, Activity, Users, Building2, Server, Database, CheckCircle2 } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-mono font-semibold mb-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Platform Super Admin Console
          </div>
          <h1 className="text-2xl font-extrabold text-white">System Health & Verification Center</h1>
          <p className="text-xs text-gray-400">Monitor tenant metrics, database vector indexing, and company verification</p>
        </div>
      </div>

      {/* System Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] glass-card space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>FastAPI Cluster SLA</span>
            <Server className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">99.99% Uptime</div>
          <div className="text-[11px] text-emerald-400 font-mono">14ms p95 API Latency</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] glass-card space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>pgvector Index Stats</span>
            <Database className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">1.4M Vectors</div>
          <div className="text-[11px] text-blue-400 font-mono">1536d OpenAI Embeddings</div>
        </div>

        <div className="p-5 rounded-2xl bg-[#18181B] border border-[#27272A] glass-card space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Verified Companies</span>
            <Building2 className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">142 Workspaces</div>
          <div className="text-[11px] text-purple-400 font-mono">100% RBAC Enforced</div>
        </div>
      </div>

      {/* Company Verification Table */}
      <div className="p-6 rounded-2xl bg-[#18181B] border border-[#27272A] glass-card space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-blue-400" /> Workspace Verification Queue
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-gray-300">
            <thead className="bg-[#111827] text-gray-400 uppercase font-mono text-[10px] border-b border-[#27272A]">
              <tr>
                <th className="p-3">Company</th>
                <th className="p-3">Plan Tier</th>
                <th className="p-3">Active Jobs</th>
                <th className="p-3">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#27272A]">
              {[
                { name: 'Linear Build', tier: 'Enterprise Intelligence', jobs: 12, verified: true },
                { name: 'Vercel Labs', tier: 'Enterprise Intelligence', jobs: 8, verified: true },
                { name: 'Cursor IDE', tier: 'Recruiter Pro', jobs: 4, verified: false },
              ].map((comp, idx) => (
                <tr key={idx} className="hover:bg-white/5 transition-colors">
                  <td className="p-3 font-bold text-white">{comp.name}</td>
                  <td className="p-3 text-gray-400">{comp.tier}</td>
                  <td className="p-3 font-mono">{comp.jobs} postings</td>
                  <td className="p-3">
                    {comp.verified ? (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono">
                        Verified
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-mono">
                        Pending Audit
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right">
                    <button className="px-3 py-1 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-lg text-[10px] font-semibold hover:bg-blue-600/30">
                      Manage Workspace
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
