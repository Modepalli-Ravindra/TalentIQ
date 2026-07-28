import React, { useState, useEffect } from 'react';
import { User, MapPin, Globe, Github, Linkedin, Mail, Briefcase, GraduationCap, Code2, Folder, Award, Edit3, Save, Loader2, Camera, Plus, X, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileService, isSupabaseConfigured } from '../lib/supabase';
import { ResumeUploader } from '../components/jobs/ResumeUploader';
import type { Profile, EducationEntry, ExperienceEntry, ProjectEntry } from '../types';
import { MOCK_CANDIDATE } from '../data/mockData';

export function CandidateProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [editing, setEditing] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<string>('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      if (isSupabaseConfigured()) {
        const { data } = await profileService.get(user.id);
        if (data) setProfile(data);
      } else {
        setProfile({
          id: user.id,
          name: user.name,
          email: user.email,
          headline: MOCK_CANDIDATE.title,
          bio: 'Passionate engineer with expertise in building scalable web applications and AI-powered systems.',
          location: 'San Francisco, CA',
          skills: MOCK_CANDIDATE.parsedSkills,
          experience_years: MOCK_CANDIDATE.experienceYears,
          education: [
            { institution: 'Stanford University', degree: 'M.S.', field: 'Computer Science', start_date: '2018', end_date: '2020' },
          ],
          experience: [
            { company: 'TechCorp', title: 'Senior Engineer', start_date: '2022', current: true, description: 'Leading frontend architecture' },
            { company: 'StartupInc', title: 'Full Stack Developer', start_date: '2020', end_date: '2022', description: 'Built core product features' },
          ],
          projects: [
            { name: 'AI Resume Scanner', description: 'NLP-powered resume analysis tool', technologies: ['Python', 'FastAPI', 'OpenAI'] },
          ],
          languages: ['English', 'Spanish'],
        });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    if (isSupabaseConfigured()) {
      await profileService.update(user.id, profile);
    }
    setTimeout(() => {
      setSaving(false);
      setEditing(false);
    }, 600);
  };

  const sections = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'experience', label: 'Experience', icon: Briefcase },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'skills', label: 'Skills', icon: Code2 },
    { id: 'projects', label: 'Projects', icon: Folder },
    { id: 'resume', label: 'Resume', icon: Award },
  ];

  const completionItems = [
    { label: 'Headline', done: !!profile.headline },
    { label: 'Bio', done: !!profile.bio },
    { label: 'Location', done: !!profile.location },
    { label: 'Skills', done: (profile.skills?.length || 0) > 0 },
    { label: 'Experience', done: (profile.experience?.length || 0) > 0 },
    { label: 'Education', done: (profile.education?.length || 0) > 0 },
  ];
  const completionPct = Math.round((completionItems.filter(i => i.done).length / completionItems.length) * 100);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Profile Header */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-[#18181B] via-blue-950/20 to-[#18181B] border border-[#27272A] flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="relative group">
            <img
              src={user?.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`}
              alt="Profile"
              className="w-20 h-20 rounded-2xl object-cover ring-2 ring-blue-500/40 shadow-xl"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer">
              <Camera className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{profile.name || user?.name}</h1>
            <p className="text-xs text-gray-400 font-medium">{profile.headline || 'No headline set'}</p>
            <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
              {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {profile.location}</span>}
              {profile.experience_years && <span>{profile.experience_years} years exp</span>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-4 bg-[#111827] border border-[#27272A] rounded-2xl text-center min-w-[120px]">
            <span className="text-2xl font-extrabold text-white block">{completionPct}%</span>
            <span className="text-[10px] text-gray-400 font-mono uppercase">Profile Complete</span>
          </div>
          <button
            onClick={() => editing ? handleSave() : setEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all"
          >
            {editing ? <><Save className="w-4 h-4" /> Save Profile</> : <><Edit3 className="w-4 h-4" /> Edit Profile</>}
          </button>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeSection === s.id
                ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
            }`}
          >
            <s.icon className="w-3.5 h-3.5" />
            {s.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl"
        >
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Headline</label>
                {editing ? (
                  <input
                    type="text"
                    value={profile.headline || ''}
                    onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                  />
                ) : (
                  <p className="text-sm text-white">{profile.headline || '-'}</p>
                )}
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1.5 font-medium">Bio</label>
                {editing ? (
                  <textarea
                    value={profile.bio || ''}
                    onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                    rows={4}
                    className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 resize-none"
                  />
                ) : (
                  <p className="text-sm text-gray-300 leading-relaxed">{profile.bio || '-'}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Location</label>
                  {editing ? (
                    <input
                      type="text"
                      value={profile.location || ''}
                      onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : (
                    <p className="text-sm text-white">{profile.location || '-'}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Skills</label>
                  {editing ? (
                    <div className="space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {profile.languages?.map((lang, i) => (
                          <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600/10 border border-blue-500/30 rounded-lg text-xs text-blue-300">
                            {lang}
                            <button
                              type="button"
                              onClick={() => setProfile(p => ({ ...p, languages: (p.languages || []).filter((_, idx) => idx !== i) }))}
                              className="ml-0.5 text-blue-400 hover:text-red-400"
                              aria-label={`Remove ${lang}`}
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Add a technical skill (e.g. React)"
                          className="flex-1 bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              const val = (e.target as HTMLInputElement).value.trim();
                              if (val && !profile.languages?.includes(val)) {
                                setProfile(p => ({ ...p, languages: [...(p.languages || []), val] }));
                              }
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={(e) => {
                            const input = (e.currentTarget.parentElement?.querySelector('input') as HTMLInputElement);
                            if (input) {
                              const val = input.value.trim();
                              if (val && !profile.languages?.includes(val)) {
                                setProfile(p => ({ ...p, languages: [...(p.languages || []), val] }));
                              }
                              input.value = '';
                            }
                          }}
                          className="px-3 bg-blue-600/20 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-semibold hover:bg-blue-600/30 transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {profile.languages?.map((lang, i) => (
                        <span key={i} className="px-3 py-1 bg-[#09090B] border border-[#27272A] rounded-lg text-xs text-gray-300">{lang}</span>
                      )) || <span className="text-sm text-gray-500">-</span>}
                    </div>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">LinkedIn</label>
                  {editing ? (
                    <input
                      type="url"
                      value={profile.linkedin_url || ''}
                      onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : profile.linkedin_url ? (
                    <a href={profile.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1"><Linkedin className="w-3 h-3" /> LinkedIn</a>
                  ) : <span className="text-sm text-gray-500">-</span>}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">GitHub</label>
                  {editing ? (
                    <input
                      type="url"
                      value={profile.github_url || ''}
                      onChange={e => setProfile(p => ({ ...p, github_url: e.target.value }))}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : profile.github_url ? (
                    <a href={profile.github_url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1"><Github className="w-3 h-3" /> GitHub</a>
                  ) : <span className="text-sm text-gray-500">-</span>}
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1.5 font-medium">Website</label>
                  {editing ? (
                    <input
                      type="url"
                      value={profile.website || ''}
                      onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                      className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                    />
                  ) : profile.website ? (
                    <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-400 hover:underline flex items-center gap-1"><Globe className="w-3 h-3" /> Website</a>
                  ) : <span className="text-sm text-gray-500">-</span>}
                </div>
              </div>
            </div>
          )}

          {activeSection === 'experience' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-blue-400" /> Work Experience
              </h3>
              {profile.experience?.map((exp, idx) => (
                <div key={idx} className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-white">{exp.title}</h4>
                      <p className="text-xs text-gray-400">{exp.company}</p>
                    </div>
                    <span className="text-xs text-gray-500 font-mono">{exp.start_date} - {exp.end_date || 'Present'}</span>
                  </div>
                  {exp.description && <p className="text-xs text-gray-300">{exp.description}</p>}
                </div>
              )) || <p className="text-sm text-gray-500">No experience added yet.</p>}
            </div>
          )}

          {activeSection === 'education' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-purple-400" /> Education
              </h3>
              {profile.education?.map((edu, idx) => (
                <div key={idx} className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                  <h4 className="text-sm font-bold text-white">{edu.degree} in {edu.field}</h4>
                  <p className="text-xs text-gray-400">{edu.institution}</p>
                  <p className="text-xs text-gray-500 font-mono mt-1">{edu.start_date} - {edu.end_date || 'Present'}</p>
                </div>
              )) || <p className="text-sm text-gray-500">No education added yet.</p>}
            </div>
          )}

          {activeSection === 'skills' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-400" /> Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {profile.skills?.map((skill, idx) => (
                  <span key={idx} className="px-4 py-2 bg-blue-600/10 text-blue-300 border border-blue-500/30 rounded-xl text-xs font-mono">
                    {skill}
                  </span>
                )) || <p className="text-sm text-gray-500">No skills added yet.</p>}
              </div>
            </div>
          )}

          {activeSection === 'projects' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Folder className="w-4 h-4 text-amber-400" /> Projects
              </h3>
              {profile.projects?.map((proj, idx) => (
                <div key={idx} className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                    {proj.url && (
                      <a href={proj.url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">View</a>
                    )}
                  </div>
                  <p className="text-xs text-gray-300">{proj.description}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {proj.technologies.map((t, i) => (
                      <span key={i} className="px-2 py-0.5 bg-[#18181B] border border-[#27272A] rounded text-[10px] text-gray-400 font-mono">{t}</span>
                    ))}
                  </div>
                </div>
              )) || <p className="text-sm text-gray-500">No projects added yet.</p>}
            </div>
          )}

          {activeSection === 'resume' && (
            <div className="space-y-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Award className="w-4 h-4 text-rose-400" /> Resume & Documents
              </h3>
              <ResumeUploader />
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
