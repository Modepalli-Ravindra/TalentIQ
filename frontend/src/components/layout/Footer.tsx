import React from 'react';
import { Sparkles, Github, Twitter, Linkedin, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-[#09090B] border-t border-[#27272A] pt-16 pb-12 mt-20 text-gray-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-10 pb-12 border-b border-[#27272A]">
          {/* Column 1: Brand */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-blue-600 to-purple-600 p-[1px]">
                <div className="w-full h-full bg-[#09090B] rounded-[7px] flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                </div>
              </div>
              <span className="font-bold text-lg text-white">TalentIQ <span className="text-blue-400 font-mono text-xs">AI</span></span>
            </div>
            <p className="text-gray-400 text-xs leading-relaxed max-w-sm">
              An AI-powered Hiring Intelligence Platform built to eliminate hiring friction, provide automated candidate-job match analytics, and empower tech teams worldwide.
            </p>
            <div className="flex items-center gap-3 pt-2 text-gray-400">
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:text-white hover:bg-blue-600/20 transition-all"><Github className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:text-white hover:bg-blue-600/20 transition-all"><Twitter className="w-4 h-4" /></a>
              <a href="#" className="p-2 rounded-lg bg-white/5 hover:text-white hover:bg-blue-600/20 transition-all"><Linkedin className="w-4 h-4" /></a>
            </div>
          </div>

          {/* Column 2: Product */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-gray-200 font-semibold mb-4">AI Platform</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-blue-400 transition-colors">Resume Match Engine</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Job Fit Analyzer</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Candidate Ranking</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Smart Follow-up Copilot</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Bias Optimizer</a></li>
            </ul>
          </div>

          {/* Column 3: Ecosystem */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-gray-200 font-semibold mb-4">Developers</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-blue-400 transition-colors">API Documentation</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">FastAPI Specs</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Vector Embeddings</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Supabase Realtime</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">System Status</a></li>
            </ul>
          </div>

          {/* Column 4: Enterprise */}
          <div>
            <h4 className="text-xs font-mono uppercase tracking-wider text-gray-200 font-semibold mb-4">Company</h4>
            <ul className="space-y-2.5 text-xs">
              <li><a href="#" className="hover:text-blue-400 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Careers (We're Hiring!)</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Security Standards</a></li>
              <li><a href="#" className="hover:text-blue-400 transition-colors">Contact Sales</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-500">
          <div>© 2026 TalentIQ AI, Inc. All rights reserved. Designed for modern tech recruitment.</div>
          <div className="flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> for senior engineers & high-growth teams.
          </div>
        </div>
      </div>
    </footer>
  );
};
