import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, AuthState } from '../types';

const API_URL = '/api/v1';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>(() => {
    const savedToken = localStorage.getItem('talentiq_token');
    const savedUser = localStorage.getItem('talentiq_user');
    if (savedToken && savedUser) {
      try {
        return {
          token: savedToken,
          user: JSON.parse(savedUser),
          isAuthenticated: true,
        };
      } catch {
        localStorage.removeItem('talentiq_token');
        localStorage.removeItem('talentiq_user');
      }
    }
    return { token: null, user: null, isAuthenticated: false };
  });

  const login = async (email: string, password: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Invalid email or password');
    }

    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as UserRole,
      avatar: data.user.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`,
    };

    localStorage.setItem('talentiq_token', data.access_token);
    localStorage.setItem('talentiq_user', JSON.stringify(user));
    setAuthState({ user, token: data.access_token, isAuthenticated: true });
  };

  const register = async (name: string, email: string, password: string, role: UserRole) => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.detail || 'Registration failed');
    }

    const user: User = {
      id: data.user.id,
      name: data.user.name,
      email: data.user.email,
      role: data.user.role as UserRole,
      avatar: data.user.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`,
    };

    localStorage.setItem('talentiq_token', data.access_token);
    localStorage.setItem('talentiq_user', JSON.stringify(user));
    setAuthState({ user, token: data.access_token, isAuthenticated: true });
  };

  const logout = () => {
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
