import React, { useState, useContext } from 'react';
import { Sparkles, Search, User as UserIcon, Briefcase, BarChart3, Command, ChevronDown, ShieldCheck, Lock, LogOut, LogIn, Bell, Settings } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NotificationContext } from '../../context/NotificationContext';

interface NavbarProps {
  currentView: string;
  onNavigateView: (view: string) => void;
  onOpenCommandPalette: () => void;
  onOpenAuthModal: (targetViewLabel?: string) => void;
  onOpenNotifications?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigateView,
  onOpenCommandPalette,
  onOpenAuthModal,
  onOpenNotifications,
}) => {
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  let unreadCount = 0;
  const notifCtx = useContext(NotificationContext);
  if (notifCtx) {
    unreadCount = notifCtx.unreadCount;
  }

  const allNavItems = [
    { id: 'landing', label: 'Overview', public: true },
    { id: 'jobs', label: 'Jobs', icon: Briefcase, public: false },
    { id: 'search', label: 'Search', icon: Search, public: false },
    { id: 'candidate-dashboard', label: 'Dashboard', icon: UserIcon, public: false, role: 'candidate' },
    { id: 'candidate-profile', label: 'Profile', icon: UserIcon, public: false, role: 'candidate' },
    { id: 'recruiter-dashboard', label: 'Recruiter', icon: Sparkles, public: false, role: 'recruiter' },
    { id: 'analytics', label: 'Analytics', icon: BarChart3, public: false },
    { id: 'admin-dashboard', label: 'Admin', icon: ShieldCheck, public: false, role: 'admin' },
  ];

  const navItems = allNavItems.filter(item => !isAuthenticated || item.id !== 'landing')
    .filter(item => !item.role || item.role === user?.role);

  const handleNavClick = (item: typeof navItems[0]) => {
    if (!item.public && !isAuthenticated) {
      onOpenAuthModal(item.label);
    } else {
      onNavigateView(item.id);
    }
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      onNavigateView(user?.role === 'recruiter' ? 'recruiter-dashboard' : 'jobs');
    } else {
      onNavigateView('landing');
    }
  };

  return (
    <header className="sticky top-4 z-50 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 transition-all">
      <div className="w-full rounded-[50px] p-[1px] bg-gradient-to-r from-blue-500/60 via-purple-500/50 to-cyan-500/60 shadow-[0_0_25px_rgba(59,130,246,0.3)] hover:shadow-[0_0_35px_rgba(139,92,246,0.45)] transition-all overflow-hidden">
        <div className="w-full h-16 px-4 sm:px-6 flex items-center justify-between gap-2 rounded-[49px] bg-[#18181B]/90 backdrop-blur-2xl">
          {/* Brand Logo */}
          <button onClick={handleLogoClick} className="flex items-center gap-2 group focus:outline-none shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 p-[1px] shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-[#09090B] rounded-[15px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 group-hover:text-purple-300 transition-colors" />
              </div>
            </div>
            <span className="font-bold text-base sm:text-lg tracking-tight text-white whitespace-nowrap">
              TalentIQ <span className="text-blue-400 font-mono">AI</span>
            </span>
          </button>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-1 xl:gap-2">
            {navItems.map((item) => {
              const isActive = currentView === item.id;
              const isLocked = !item.public && !isAuthenticated;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                    isActive
                      ? 'bg-blue-600/20 text-blue-300 border border-blue-500/40 shadow-sm shadow-blue-500/20'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {item.icon && <item.icon className="w-3.5 h-3.5" />}
                  {item.label}
                  {isLocked && <Lock className="w-3 h-3 text-amber-400/80" />}
                </button>
              );
            })}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <button
              onClick={onOpenCommandPalette}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#09090B] border border-[#27272A] rounded-full text-xs text-gray-400 hover:text-white hover:border-blue-500/50 transition-all shadow-inner shrink-0"
              title="Search (Cmd + K)"
            >
              <Search className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden xl:inline text-xs">Search...</span>
              <kbd className="hidden sm:flex px-1.5 py-0.5 bg-[#27272A] text-gray-300 rounded font-mono text-[10px] items-center gap-0.5 border border-gray-700">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </button>

            {isAuthenticated && user ? (
              <div className="flex items-center gap-2 sm:gap-3 shrink-0 pl-2 border-l border-[#27272A]">
                <button
                  onClick={() => onOpenNotifications?.()}
                  className="relative p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                  aria-label="Open notifications"
                >
                  <Bell className="w-4 h-4" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => onNavigateView('settings')}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-full transition-colors"
                  aria-label="Settings"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <div className="flex items-center gap-2">
                  <img
                    src={user.avatar || `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ccircle cx='50' cy='35' r='20' fill='%2352525b'/%3E%3Cellipse cx='50' cy='85' rx='32' ry='22' fill='%2352525b'/%3E%3C/svg%3E`}
                    alt={user.name}
                    className="w-8 h-8 rounded-full ring-2 ring-blue-500/40 object-cover"
                  />
                  <div className="hidden sm:flex flex-col text-left">
                    <span className="text-xs font-bold text-white leading-tight">{user.name}</span>
                    <span className="text-[10px] text-blue-400 font-mono capitalize">{user.role}</span>
                  </div>
                </div>

                <button
                  onClick={() => logout()}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:border-rose-500/50 rounded-full text-xs font-semibold transition-all shrink-0"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                <button
                  onClick={() => onOpenAuthModal('Intelligence Dashboard')}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-300 hover:text-white transition-colors shrink-0"
                >
                  Sign In
                </button>
                <button
                  onClick={() => onOpenAuthModal('Intelligence Dashboard')}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/25 transition-all shrink-0 whitespace-nowrap"
                >
                  <LogIn className="w-3.5 h-3.5" /> Get Started
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
