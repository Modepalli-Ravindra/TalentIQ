import React, { useState } from 'react';
import { X, MapPin, DollarSign, Clock, Building2, Sparkles, CheckCircle2, Send, MessageSquare, Briefcase } from 'lucide-react';
import { JobPosting, CandidateProfile } from '../../types';
import { MatchMeter } from '../ui/MatchMeter';

interface JobDetailsModalProps {
  job: JobPosting;
  candidate: CandidateProfile;
  onClose: () => void;
  onOpenFitAnalyzer: (job: JobPosting) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  candidate,
  onClose,
  onOpenFitAnalyzer
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'assistant'>('overview');
  const [chatMessages, setChatMessages] = useState([
    { id: '1', sender: 'ai', text: `Hi! I am the TalentIQ AI Assistant for ${job.company}. Ask me anything about the salary, hiring timeline, engineering culture, or remote policy for ${job.title}.` }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSendQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputQuery.trim()) return;

    const userText = inputQuery;
    setChatMessages((prev) => [...prev, { id: Date.now().toString(), sender: 'user', text: userText }]);
    setInputQuery('');
    setIsTyping(true);

    setTimeout(() => {
      let aiReply = `Regarding "${userText}": ${job.company} offers high flexibility with ${job.locationType} work options, comprehensive health benefits, and a target compensation of $${(job.salaryMin/1000).toFixed(0)}k-$${(job.salaryMax/1000).toFixed(0)}k.`;
      if (userText.toLowerCase().includes('interview') || userText.toLowerCase().includes('process')) {
        aiReply = `${job.company}'s hiring process consists of: 1) Initial 30-min recruiter chat, 2) Technical architecture deep dive, 3) 2-hour practical code pair session, and 4) Final executive cultural alignment. Total time: ~10 business days.`;
      } else if (userText.toLowerCase().includes('tech') || userText.toLowerCase().includes('stack')) {
        aiReply = `The core stack includes ${job.techStack.join(', ')}. The team heavily values automated testing, clean architectural boundaries, and performance optimization.`;
      }

      setChatMessages((prev) => [...prev, { id: (Date.now() + 1).toString(), sender: 'ai', text: aiReply }]);
      setIsTyping(false);
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-3xl bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden glass-card flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#111827]">
          <div className="flex items-center gap-3">
            <img src={job.companyLogo} alt={job.company} className="w-10 h-10 rounded-xl object-cover ring-1 ring-white/10" />
            <div>
              <h2 className="text-base font-bold text-white line-clamp-1">{job.title}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span>{job.company}</span>
                <span>•</span>
                <span className="text-emerald-400 font-mono">${(job.salaryMin/1000).toFixed(0)}k - ${(job.salaryMax/1000).toFixed(0)}k</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {job.matchScore && <MatchMeter score={job.matchScore} size="md" />}
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[#27272A] bg-[#09090B] px-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'overview'
                ? 'border-blue-500 text-blue-400 bg-blue-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Briefcase className="w-3.5 h-3.5" /> Job Overview & Requirements
          </button>

          <button
            onClick={() => setActiveTab('assistant')}
            className={`px-4 py-3 text-xs font-semibold border-b-2 flex items-center gap-2 transition-all ${
              activeTab === 'assistant'
                ? 'border-purple-500 text-purple-400 bg-purple-500/5'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> AI Job Assistant Chat
            <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">AI</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'overview' ? (
            <div className="space-y-6 text-xs leading-relaxed text-gray-300">
              {/* Meta Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-xl bg-[#111827] border border-[#27272A]">
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Location</span>
                  <span className="font-semibold text-gray-200">{job.location}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Work Policy</span>
                  <span className="font-semibold text-blue-400">{job.locationType}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Level</span>
                  <span className="font-semibold text-gray-200">{job.experienceLevel}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 uppercase font-mono block">Applicants</span>
                  <span className="font-semibold text-emerald-400">{job.applicantsCount} candidates</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">About the Role</h3>
                <p className="text-gray-300 leading-relaxed">{job.description}</p>
              </div>

              {/* Responsibilities */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Key Responsibilities</h3>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tech Stack */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Technical Stack</h3>
                <div className="flex flex-wrap gap-2">
                  {job.techStack.map((tech) => (
                    <span key={tech} className="px-3 py-1 bg-[#111827] border border-[#27272A] rounded-lg text-xs font-mono text-blue-300">
                      {tech}
                    </span>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <h3 className="text-sm font-bold text-white mb-2">Perks & Compensation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.benefits.map((b, idx) => (
                    <div key={idx} className="p-3 bg-[#111827] border border-[#27272A] rounded-lg text-gray-300">
                      ✓ {b}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* AI Assistant Chat view */
            <div className="flex flex-col h-full min-h-[350px]">
              <div className="flex-1 space-y-3 overflow-y-auto p-2">
                {chatMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3.5 rounded-2xl text-xs leading-relaxed ${
                        msg.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-[#111827] border border-[#27272A] text-gray-200 rounded-bl-none shadow-sm'
                      }`}
                    >
                      {msg.sender === 'ai' && (
                        <div className="flex items-center gap-1.5 text-purple-400 font-mono text-[10px] mb-1 font-semibold">
                          <Sparkles className="w-3 h-3" /> TalentIQ AI Assistant
                        </div>
                      )}
                      {msg.text}
                    </div>
                  </div>
                ))}

                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-[#111827] border border-[#27272A] p-3 rounded-2xl text-xs text-gray-400 flex items-center gap-2">
                      <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" />
                      Analyzing company data...
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <form onSubmit={handleSendQuery} className="mt-4 flex items-center gap-2 pt-3 border-t border-[#27272A]">
                <input
                  type="text"
                  placeholder="Ask AI about salary range, interview rounds, tech stack..."
                  className="flex-1 bg-[#111827] border border-[#27272A] rounded-xl px-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  value={inputQuery}
                  onChange={(e) => setInputQuery(e.target.value)}
                />
                <button
                  type="submit"
                  className="p-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#27272A] bg-[#111827] flex items-center justify-between">
          <button
            onClick={() => onOpenFitAnalyzer(job)}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-xl text-xs font-semibold hover:bg-purple-500/20"
          >
            <Sparkles className="w-4 h-4" /> Evaluate My AI Match
          </button>
          <button
            onClick={() => onOpenFitAnalyzer(job)}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20"
          >
            Apply Now
          </button>
        </div>
      </div>
    </div>
  );
};
