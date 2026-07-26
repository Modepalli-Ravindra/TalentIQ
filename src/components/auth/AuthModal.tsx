import React, { useState } from 'react';
import { X, Sparkles, Mail, Lock, User as UserIcon, ArrowRight, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetViewLabel?: string;
  initialMode?: 'login' | 'register';
  onSuccessRedirect?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  targetViewLabel = 'Intelligence Workspace',
  initialMode = 'login',
  onSuccessRedirect
}) => {
  const { login, register, isAuthenticated } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  // If auth succeeded via Supabase listener, close modal
  if (isAuthenticated && !loading) {
    onClose();
    if (onSuccessRedirect) onSuccessRedirect();
    return null;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password, role);
        onClose();
        if (onSuccessRedirect) onSuccessRedirect();
      } else {
        await register(name, email, password, role);
        // After register, Supabase may require email confirmation
        setSuccessMsg(
          'Account created! Check your email for a confirmation link, then sign in.'
        );
        setMode('login');
        setPassword('');
      }
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('Invalid login credentials') || msg.includes('invalid_credentials')) {
        setError('Incorrect email or password. Please try again.');
      } else if (msg.includes('Email not confirmed')) {
        setError('Please confirm your email first. Check your inbox for the confirmation link.');
      } else if (msg.includes('User already registered')) {
        setError('An account with this email already exists. Try signing in instead.');
        setMode('login');
      } else if (msg.includes('Password should be')) {
        setError('Password must be at least 6 characters.');
      } else {
        setError(msg || 'Something went wrong. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-[#18181B] border border-[#27272A] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#27272A] bg-[#111827]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {mode === 'login' ? 'Sign In to TalentIQ AI' : 'Create Intelligence Account'}
              </h2>
              <p className="text-xs text-gray-400">Required to access {targetViewLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-4">

          {/* Success Message */}
          {successMsg && (
            <div className="flex items-start gap-2.5 p-3 bg-green-500/10 border border-green-500/30 rounded-xl">
              <CheckCircle2 className="w-4 h-4 text-green-400 mt-0.5 shrink-0" />
              <p className="text-xs text-green-300 leading-relaxed">{successMsg}</p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2.5 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl">
              <AlertCircle className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
              <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'register' && (
              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Full Name</label>
                <div className="flex items-center bg-[#09090B] border border-[#27272A] focus-within:border-blue-500/60 rounded-xl px-3 py-2.5 gap-2 transition-colors">
                  <UserIcon className="w-4 h-4 text-gray-500 shrink-0" />
                  <input
                    type="text"
                    required
                    placeholder="Alex Rivera"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-gray-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Email</label>
              <div className="flex items-center bg-[#09090B] border border-[#27272A] focus-within:border-blue-500/60 rounded-xl px-3 py-2.5 gap-2 transition-colors">
                <Mail className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="email"
                  required
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(null); }}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-mono text-gray-400 block mb-1">Password</label>
              <div className="flex items-center bg-[#09090B] border border-[#27272A] focus-within:border-blue-500/60 rounded-xl px-3 py-2.5 gap-2 transition-colors">
                <Lock className="w-4 h-4 text-gray-500 shrink-0" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="Min. 6 characters"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(null); }}
                  className="w-full bg-transparent text-xs text-white focus:outline-none placeholder:text-gray-600"
                />
              </div>
            </div>

            {mode === 'register' && (
              <div>
                <label className="text-xs font-mono text-gray-400 block mb-1">Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('candidate')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                      role === 'candidate'
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300'
                        : 'bg-[#09090B] border-[#27272A] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    Candidate
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('recruiter')}
                    className={`p-2 rounded-xl text-xs font-semibold border transition-all ${
                      role === 'recruiter'
                        ? 'bg-purple-600/20 border-purple-500 text-purple-300'
                        : 'bg-[#09090B] border-[#27272A] text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    Recruiter
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  {mode === 'login' ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Mode */}
          <div className="text-center pt-1 border-t border-[#27272A]">
            <button
              onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(null); setSuccessMsg(null); }}
              className="text-xs text-blue-400 hover:underline font-semibold"
            >
              {mode === 'login'
                ? "Don't have an account? Create one"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
