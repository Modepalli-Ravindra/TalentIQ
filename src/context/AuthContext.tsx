import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthState } from '../types';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

interface AuthContextType extends AuthState {
  login: (email: string, password: string, role?: UserRole) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('talentiq_token');
    const savedUser = localStorage.getItem('talentiq_user');
    if (savedToken && savedUser) {
      return {
        token: savedToken,
        user: JSON.parse(savedUser),
        isAuthenticated: true
      };
    }
    return { token: null, user: null, isAuthenticated: false };
  });

  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Listen to Supabase auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        const supaUser: User = {
          id: session.user.id,
          name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'TalentIQ User',
          email: session.user.email || '',
          role: (session.user.user_metadata?.role as UserRole) || 'candidate',
          avatar: session.user.user_metadata?.avatar_url || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
        };
        const token = session.access_token;
        localStorage.setItem('talentiq_token', token);
        localStorage.setItem('talentiq_user', JSON.stringify(supaUser));
        setAuthState({ user: supaUser, token, isAuthenticated: true });
      } else if (event === 'SIGNED_OUT') {
        localStorage.removeItem('talentiq_token');
        localStorage.removeItem('talentiq_user');
        setAuthState({ token: null, user: null, isAuthenticated: false });
      }
    });

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string, role: UserRole = 'candidate') => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        // Throw so AuthModal can catch and display the message
        throw new Error(error.message);
      }
      if (data.session) {
        // onAuthStateChange handles setting auth state
        return;
      }
    }

    // Local / Dev Fallback (Supabase not configured)
    const isRecruiter = email.includes('recruiter');
    const assignedRole = isRecruiter ? 'recruiter' : role;
    const mockUser: User = {
      id: `user-${Date.now()}`,
      name: isRecruiter ? 'Sarah Jenkins' : 'Alex Rivera',
      email,
      role: assignedRole,
      avatar: isRecruiter
        ? `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
        : `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
    };
    const mockToken = `jwt-token-${Date.now()}`;
    localStorage.setItem('talentiq_token', mockToken);
    localStorage.setItem('talentiq_user', JSON.stringify(mockUser));
    setAuthState({ user: mockUser, token: mockToken, isAuthenticated: true });
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { full_name: name, role } }
      });
      if (error) {
        // Throw so AuthModal can catch and display the message
        throw new Error(error.message);
      }
      // data.session is null when email confirmation is required
      // AuthModal will show the "check your email" message in that case
      if (data.session) {
        // onAuthStateChange handles setting auth state
        return;
      }
      // No session = email confirmation required; let AuthModal handle the UI
      return;
    }

    // Local / Dev Fallback (Supabase not configured)
    const newUser: User = {
      id: `user-${Date.now()}`,
      name,
      email,
      role,
      avatar: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`
    };
    const mockToken = `jwt-token-${Date.now()}`;
    localStorage.setItem('talentiq_token', mockToken);
    localStorage.setItem('talentiq_user', JSON.stringify(newUser));
    setAuthState({ user: newUser, token: mockToken, isAuthenticated: true });
  };

  const logout = async () => {
    if (isSupabaseConfigured()) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Supabase logout notice:', err);
      }
    }
    localStorage.removeItem('talentiq_token');
    localStorage.removeItem('talentiq_user');
    setAuthState({ token: null, user: null, isAuthenticated: false });
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
