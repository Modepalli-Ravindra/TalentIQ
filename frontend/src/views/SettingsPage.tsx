import React, { useState, useEffect } from 'react';
import { Settings, User, Shield, Bell, Eye, Trash2, Lock, Save, Loader2, Check, Key, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { profileService, settingsService, authService, isSupabaseConfigured } from '../lib/supabase';
import type { Profile, UserPreferences } from '../types';

type Tab = 'profile' | 'password' | 'notifications' | 'privacy' | 'account';

export function SettingsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>('profile');
  const [profile, setProfile] = useState<Partial<Profile>>({});
  const [preferences, setPreferences] = useState<UserPreferences>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      if (isSupabaseConfigured()) {
        const { data: p } = await profileService.get(user.id);
        if (p) setProfile(p);
        const { data: s } = await settingsService.get(user.id);
        if (s?.preferences) setPreferences(s.preferences);
      } else {
        setProfile({ name: user.name, email: user.email, bio: '', headline: '', location: '' });
        setPreferences({ email_notifications: true, push_notifications: true, visibility: 'public' });
      }
      setLoading(false);
    };
    load();
  }, [user]);

  const handleSaveProfile = async () => {
    if (!user) return;
    setSaving(true);
    if (isSupabaseConfigured()) {
      await profileService.update(user.id, profile);
    }
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  };

  const handleSavePreferences = async () => {
    if (!user) return;
    setSaving(true);
    if (isSupabaseConfigured()) {
      await settingsService.updatePreferences(user.id, preferences);
    }
    setTimeout(() => {
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }, 600);
  };

  const handleChangePassword = async () => {
    setPasswordError('');
    setPasswordSuccess(false);
    if (password.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setSaving(true);
    if (isSupabaseConfigured()) {
      const { error } = await authService.changePassword(password);
      if (error) {
        setPasswordError(error.message);
        setSaving(false);
        return;
      }
    }
    setSaving(false);
    setPasswordSuccess(true);
    setPassword('');
    setConfirmPassword('');
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
    { id: 'password', label: 'Password', icon: <Lock className="w-4 h-4" /> },
    { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" /> },
    { id: 'privacy', label: 'Privacy', icon: <Eye className="w-4 h-4" /> },
    { id: 'account', label: 'Account', icon: <Shield className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 text-xs font-mono font-semibold mb-2">
          <Settings className="w-3.5 h-3.5" /> Account Settings
        </div>
        <h1 className="text-2xl font-extrabold text-white">Settings & Preferences</h1>
        <p className="text-xs text-gray-400 mt-1">Manage your profile, security, and notification preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar Tabs */}
        <div className="lg:w-56 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
                  : 'text-gray-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-6 bg-[#18181B] border border-[#27272A] rounded-2xl space-y-6"
            >
              {activeTab === 'profile' && (
                <>
                  <h2 className="text-base font-bold text-white">Profile Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Full Name</label>
                      <input
                        type="text"
                        value={profile.name || ''}
                        onChange={e => setProfile(p => ({ ...p, name: e.target.value }))}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Email</label>
                      <input
                        type="email"
                        value={profile.email || ''}
                        disabled
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-gray-500 cursor-not-allowed"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Headline</label>
                      <input
                        type="text"
                        value={profile.headline || ''}
                        onChange={e => setProfile(p => ({ ...p, headline: e.target.value }))}
                        placeholder="e.g. Senior Full Stack Engineer"
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Bio</label>
                      <textarea
                        value={profile.bio || ''}
                        onChange={e => setProfile(p => ({ ...p, bio: e.target.value }))}
                        rows={3}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 resize-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Location</label>
                      <input
                        type="text"
                        value={profile.location || ''}
                        onChange={e => setProfile(p => ({ ...p, location: e.target.value }))}
                        placeholder="San Francisco, CA"
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Phone</label>
                      <input
                        type="tel"
                        value={profile.phone || ''}
                        onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))}
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">LinkedIn URL</label>
                      <input
                        type="url"
                        value={profile.linkedin_url || ''}
                        onChange={e => setProfile(p => ({ ...p, linkedin_url: e.target.value }))}
                        placeholder="https://linkedin.com/in/..."
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">GitHub URL</label>
                      <input
                        type="url"
                        value={profile.github_url || ''}
                        onChange={e => setProfile(p => ({ ...p, github_url: e.target.value }))}
                        placeholder="https://github.com/..."
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Website</label>
                      <input
                        type="url"
                        value={profile.website || ''}
                        onChange={e => setProfile(p => ({ ...p, website: e.target.value }))}
                        placeholder="https://..."
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton saving={saving} saved={saved} onClick={handleSaveProfile} />
                  </div>
                </>
              )}

              {activeTab === 'password' && (
                <>
                  <h2 className="text-base font-bold text-white">Change Password</h2>
                  <div className="max-w-md space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">New Password</label>
                      <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-400 mb-1.5 font-medium">Confirm Password</label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        className="w-full bg-[#09090B] border border-[#27272A] rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    {passwordError && (
                      <p className="text-xs text-red-400">{passwordError}</p>
                    )}
                    {passwordSuccess && (
                      <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Password updated successfully</p>
                    )}
                    <div className="flex justify-end">
                      <SaveButton saving={saving} saved={passwordSuccess} onClick={handleChangePassword} label="Update Password" />
                    </div>
                  </div>
                </>
              )}

              {activeTab === 'notifications' && (
                <>
                  <h2 className="text-base font-bold text-white">Notification Preferences</h2>
                  <div className="space-y-4">
                    {[
                      { key: 'email_notifications' as const, label: 'Email Notifications', desc: 'Receive email updates for important events' },
                      { key: 'push_notifications' as const, label: 'Push Notifications', desc: 'Browser push notifications for real-time updates' },
                      { key: 'job_alerts' as const, label: 'Job Alerts', desc: 'Get notified about new jobs matching your skills' },
                      { key: 'weekly_digest' as const, label: 'Weekly Digest', desc: 'Summary of your activity and recommendations' },
                    ].map(item => (
                      <label key={item.key} className="flex items-center justify-between p-4 bg-[#09090B] border border-[#27272A] rounded-xl cursor-pointer hover:border-zinc-600 transition-colors">
                        <div>
                          <p className="text-sm text-white font-medium">{item.label}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{item.desc}</p>
                        </div>
                        <div className="relative">
                          <input
                            type="checkbox"
                            checked={preferences[item.key] ?? true}
                            onChange={e => setPreferences(p => ({ ...p, [item.key]: e.target.checked }))}
                            className="sr-only"
                          />
                          <div className={`w-10 h-6 rounded-full transition-colors ${preferences[item.key] ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform mt-1 ${preferences[item.key] ? 'translate-x-5' : 'translate-x-1'}`} />
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <SaveButton saving={saving} saved={saved} onClick={handleSavePreferences} />
                  </div>
                </>
              )}

              {activeTab === 'privacy' && (
                <>
                  <h2 className="text-base font-bold text-white">Privacy & Visibility</h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-400 mb-2 font-medium">Profile Visibility</label>
                      <div className="space-y-2">
                        {[
                          { value: 'public' as const, label: 'Public', desc: 'Visible to everyone including recruiters' },
                          { value: 'recruiters_only' as const, label: 'Recruiters Only', desc: 'Only visible to verified recruiters' },
                          { value: 'private' as const, label: 'Private', desc: 'Only visible to you' },
                        ].map(opt => (
                          <label key={opt.value} className={`flex items-center gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                            preferences.visibility === opt.value
                              ? 'bg-blue-600/10 border-blue-500/40'
                              : 'bg-[#09090B] border-[#27272A] hover:border-zinc-600'
                          }`}>
                            <input
                              type="radio"
                              name="visibility"
                              value={opt.value}
                              checked={preferences.visibility === opt.value}
                              onChange={e => setPreferences(p => ({ ...p, visibility: e.target.value as UserPreferences['visibility'] }))}
                              className="sr-only"
                            />
                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                              preferences.visibility === opt.value ? 'border-blue-500' : 'border-zinc-600'
                            }`}>
                              {preferences.visibility === opt.value && <div className="w-2 h-2 bg-blue-500 rounded-full" />}
                            </div>
                            <div>
                              <p className="text-sm text-white">{opt.label}</p>
                              <p className="text-xs text-gray-400">{opt.desc}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <SaveButton saving={saving} saved={saved} onClick={handleSavePreferences} />
                  </div>
                </>
              )}

              {activeTab === 'account' && (
                <>
                  <h2 className="text-base font-bold text-white">Account Management</h2>
                  <div className="space-y-6">
                    <div className="p-4 bg-[#09090B] border border-[#27272A] rounded-xl">
                      <h3 className="text-sm text-white font-medium flex items-center gap-2 mb-2">
                        <Key className="w-4 h-4 text-blue-400" /> Connected Accounts
                      </h3>
                      <p className="text-xs text-gray-400">Your account is connected via email authentication through Supabase.</p>
                    </div>
                    <div className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                      <h3 className="text-sm text-red-400 font-medium flex items-center gap-2 mb-2">
                        <Trash2 className="w-4 h-4" /> Delete Account
                      </h3>
                      <p className="text-xs text-gray-400 mb-3">
                        This action is irreversible. All your data, applications, and profile information will be permanently deleted.
                      </p>
                      <button className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors">
                        Request Account Deletion
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SaveButton({ saving, saved, onClick, label = 'Save Changes' }: { saving: boolean; saved: boolean; onClick: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all"
    >
      {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
      {saving ? 'Saving...' : saved ? 'Saved!' : label}
    </button>
  );
}
