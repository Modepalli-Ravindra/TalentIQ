import React from 'react';
import { Sparkles, ArrowRight, CheckCircle2, Zap, Users, Bot, Play, Loader2 } from 'lucide-react';
import { JobPosting, ExternalJob } from '../types';
import { useExternalJobs } from '../hooks/useJobs';
import { ExternalJobCard } from '../components/jobs/ExternalJobCard';

interface LandingPageProps {
  onSelectJob: (job: JobPosting) => void;
  onAnalyzeFit: (job: JobPosting) => void;
  onExploreJobs: () => void;
  onExternalJobSelect?: (job: ExternalJob) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onSelectJob,
  onAnalyzeFit,
  onExploreJobs,
  onExternalJobSelect,
}) => {
  const { data, isLoading } = useExternalJobs(1, 4, 'published_at', 'desc');
  const featuredJobs = data?.data || [];

  return (
    <div className="relative space-y-24 overflow-hidden">
      <div className="gradient-spotlight top-10 left-1/2 -translate-x-1/2" />
      <div className="gradient-spotlight top-[800px] right-10" />

      {/* Hero Section */}
      <section className="relative pt-16 pb-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8 z-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-semibold backdrop-blur-md animate-bounce-slow">
          <Sparkles className="w-3.5 h-3.5 text-blue-400" />
          <span>TalentIQ AI 2.0 Engine is Live</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white max-w-4xl mx-auto leading-[1.1]">
          The AI-Powered <br />
          <span className="text-gradient-accent">Hiring Intelligence</span> Platform
        </h1>

        <p className="text-base sm:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
          Stop sifting through hundreds of mismatched resumes. TalentIQ AI automates candidate evaluation, computes real-time technical fit scores, and streamlines hiring pipelines for top tech teams.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onExploreJobs}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-sm font-bold shadow-xl shadow-blue-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Explore Live Jobs
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={onExploreJobs}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-[#18181B] hover:bg-[#222226] border border-[#27272A] hover:border-gray-500 text-gray-200 rounded-2xl text-sm font-bold transition-all"
          >
            <Play className="w-4 h-4 text-blue-400 fill-blue-400" />
            Watch 2-Min Interactive Demo
          </button>
        </div>

        {/* Live Jobs Preview */}
        <div className="pt-10 max-w-5xl mx-auto">
          <div className="p-3 rounded-3xl bg-[#111827]/80 border border-[#27272A] shadow-2xl backdrop-blur-2xl">
            <div className="rounded-2xl bg-[#09090B] border border-[#27272A] p-6 text-left space-y-6">
              <div className="flex items-center justify-between border-b border-[#27272A] pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 rounded-full bg-rose-500" />
                  <div className="w-3 h-3 rounded-full bg-amber-500" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span className="text-xs font-mono text-gray-500 ml-2">TalentIQ AI // Live Job Feed</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-mono text-blue-400 bg-blue-500/10 px-3 py-1 rounded-lg border border-blue-500/30">
                  <Sparkles className="w-3.5 h-3.5" /> Live from Arbeitnow
                </div>
              </div>

              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {featuredJobs.slice(0, 2).map((job) => (
                    <ExternalJobCard
                      key={job.id}
                      job={job}
                      onSelect={() => onExternalJobSelect?.(job)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Trusted Logos */}
      <section className="max-w-7xl mx-auto px-4 text-center space-y-4">
        <p className="text-xs font-mono uppercase tracking-widest text-gray-500">
          Trusted by technical hiring teams at high-growth engineering startups
        </p>
        <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12 opacity-60 grayscale hover:grayscale-0 transition-all">
          <span className="text-base font-bold text-gray-300 font-mono tracking-tighter">LINEAR</span>
          <span className="text-base font-bold text-gray-300 font-mono tracking-tighter">VERCEL</span>
          <span className="text-base font-bold text-gray-300 font-mono tracking-tighter">STRIPE</span>
          <span className="text-base font-bold text-gray-300 font-mono tracking-tighter">CURSOR</span>
          <span className="text-base font-bold text-gray-300 font-mono tracking-tighter">ASHBY</span>
        </div>
      </section>

      {/* Value Pillars */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase text-blue-400 font-semibold tracking-wider">
            Engineered for Value
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            8 Real-World Business Problems. Solved with AI.
          </h2>
          <p className="text-sm text-gray-400 max-w-xl mx-auto">
            Every feature in TalentIQ AI is designed to eliminate recruitment bottlenecks and increase team velocity.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              icon: Zap,
              title: 'AI Resume Match Engine',
              desc: 'Contextual parsing and candidate ranking based on experience, projects, and actual technical depth.',
              stat: '85% Screening Time Saved'
            },
            {
              icon: Bot,
              title: 'Pre-Apply Job Fit Analyzer',
              desc: 'Calculates candidate fit score before submission, highlighting strengths and offering 1-hour micro-learning paths.',
              stat: '3.2x Higher Lead Quality'
            },
            {
              icon: Users,
              title: 'Candidate & Recruiter Co-Pilots',
              desc: 'Embedded AI assistant answering culture/tech questions and drafting automated follow-up communications.',
              stat: '94% Offer Completion'
            },
          ].map((pillar, idx) => (
            <div
              key={idx}
              className="glass-card glass-card-hover p-8 rounded-2xl space-y-4 border border-[#27272A] relative group"
            >
              <div className="p-3 w-12 h-12 rounded-xl bg-blue-600/10 text-blue-400 border border-blue-500/30 flex items-center justify-center group-hover:scale-110 transition-transform">
                <pillar.icon className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">{pillar.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{pillar.desc}</p>
              <div className="pt-2 text-xs font-mono text-emerald-400 font-semibold border-t border-[#27272A]">
                ✓ {pillar.stat}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-mono uppercase text-purple-400 font-semibold tracking-wider">
            Simple Transparent Pricing
          </span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Designed for Engineers & Scaling Teams
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: 'Candidate Free', price: '$0', desc: 'For developers evaluating job fit', features: ['Unlimited AI Fit Analysis', 'Resume Heatmap', 'AI Assistant Access', 'Application Tracking'] },
            { name: 'Recruiter Pro', price: '$149', popular: true, desc: 'For hiring managers & recruiters', features: ['AI Resume Match Engine', 'Kanban Hiring Pipeline', 'AI Follow-up Generator', 'Bias Optimizer', '5 Active Jobs'] },
            { name: 'Enterprise Intelligence', price: '$499', desc: 'For scale-up engineering teams', features: ['Custom Vector Embeddings', 'Dedicated FastAPI Backend', 'Unlimited Active Postings', 'Full Analytics Funnel', '24/7 SLA Support'] }
          ].map((tier, idx) => (
            <div
              key={idx}
              className={`p-8 rounded-2xl bg-[#18181B] border space-y-6 flex flex-col justify-between relative ${
                tier.popular ? 'border-blue-500 shadow-2xl shadow-blue-500/10' : 'border-[#27272A]'
              }`}
            >
              {tier.popular && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-blue-600 text-white font-mono text-[10px] font-bold uppercase rounded-full">
                  Most Popular
                </span>
              )}
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white">{tier.name}</h3>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-white">{tier.price}</span>
                  <span className="text-xs text-gray-400 font-mono">/ month</span>
                </div>
                <p className="text-xs text-gray-400">{tier.desc}</p>
                <ul className="space-y-2.5 pt-4 border-t border-[#27272A] text-xs text-gray-300">
                  {tier.features.map((feat, i) => (
                    <li key={i} className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <button
                onClick={onExploreJobs}
                className={`w-full py-3 rounded-xl text-xs font-bold transition-all ${
                  tier.popular
                    ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/20'
                    : 'bg-[#111827] hover:bg-white/10 text-white border border-[#27272A]'
                }`}
              >
                Get Started
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
