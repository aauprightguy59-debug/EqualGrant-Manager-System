import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AppView, UserRole } from '../types';
import {
  ChevronDown,
  Globe,
  LogOut,
  Shield,
  LayoutDashboard,
  FileText,
  User as UserIcon,
  Database,
  Sparkles,
} from 'lucide-react';

interface NavbarProps {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  onOpenAuth: (mode: 'login' | 'register', role?: UserRole) => void;
  onOpenProfile: () => void;
  onOpenDatabaseSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  onOpenAuth,
  onOpenProfile,
  onOpenDatabaseSettings,
}) => {
  const { user, logout } = useAuth();
  const [createDropdownOpen, setCreateDropdownOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);

  const handleNavClick = (sectionId: string) => {
    if (currentView !== 'landing') {
      setCurrentView('landing');
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(sectionId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#070b1c]/75 backdrop-blur-md transition-colors">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-5 py-3.5 md:px-8">
        {/* Brand Logo & Title */}
        <button
          onClick={() => {
            setCurrentView('landing');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          className="flex items-center gap-3 text-left group cursor-pointer"
          aria-label="Go to home"
          id="navbar-brand-button"
        >
          {/* Logo container with dedicated circular background for optimal contrast against the dark header */}
          <div className="relative flex items-center justify-center">
            {/* Ambient halo effect matching brand colors */}
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-blue-600/40 via-emerald-500/30 to-amber-400/20 blur-[6px] opacity-70 group-hover:opacity-100 transition duration-300" />
            
            {/* Crisp white circular base ensuring the blue and green emblem pops against dark navy header */}
            <div className="relative flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center overflow-hidden rounded-full bg-white p-0.5 shadow-md shadow-blue-950/60 ring-2 ring-white/50 transition-transform duration-300 group-hover:scale-105 group-hover:ring-emerald-400/70">
              <img
                src="/assets/equalgrant_logo.png"
                alt="EqualGrant Manager Logo"
                className="h-full w-full object-contain rounded-full"
                referrerPolicy="no-referrer"
                id="header-brand-logo-img"
              />
            </div>
          </div>

          <div className="flex flex-col">
            <span className="text-[15px] font-semibold tracking-tight text-white leading-tight">
              EqualGrant Manager
            </span>
            <span className="text-[11px] text-white/50 hidden sm:inline leading-tight">
              Global Grant Lifecycle SaaS
            </span>
          </div>
        </button>

        {/* Center Nav Items (when on landing) */}
        {currentView === 'landing' && (
          <nav className="hidden items-center gap-7 text-[13.5px] text-white/70 md:flex">
            <button
              onClick={() => handleNavClick('home')}
              className="hover:text-white transition cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('open-calls')}
              className="hover:text-white transition cursor-pointer"
            >
              Open Calls
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-white transition cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={onOpenDatabaseSettings}
              className="flex items-center gap-1.5 text-xs text-violet-300/80 hover:text-violet-200 bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-400/20 transition cursor-pointer"
            >
              <Database className="h-3 w-3" />
              <span>Storage Sync</span>
            </button>
          </nav>
        )}

        {/* Right Section: Auth State / Actions */}
        <div className="flex items-center gap-2.5">
          {user ? (
            // Logged In State
            <div className="flex items-center gap-2">
              {/* Active Workspace Link */}
              <button
                onClick={() => setCurrentView(user.role === 'funder' ? 'funder' : 'awardee')}
                className={`hidden sm:flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[12.5px] font-medium border transition ${
                  currentView === user.role
                    ? 'bg-white text-black border-white'
                    : 'bg-white/[0.05] text-white/80 border-white/[0.10] hover:bg-white/[0.09]'
                }`}
                id="navbar-workspace-btn"
              >
                {user.role === 'funder' ? (
                  <LayoutDashboard className="h-3.5 w-3.5 text-violet-400" />
                ) : (
                  <FileText className="h-3.5 w-3.5 text-sky-400" />
                )}
                <span>{user.role === 'funder' ? 'Funder Workspace' : 'Awardee Workspace'}</span>
              </button>

              {/* User Profile Trigger */}
              <button
                onClick={onOpenProfile}
                className="flex items-center gap-2 rounded-full border border-white/[0.12] bg-white/[0.05] hover:bg-white/[0.09] px-3 py-1.5 text-[12.5px] transition text-left"
                id="navbar-profile-btn"
                title="View Security & Account Profile"
              >
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-semibold ${
                    user.role === 'funder'
                      ? 'bg-violet-600 text-white'
                      : 'bg-sky-600 text-white'
                  }`}
                >
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-[12px] font-medium text-white leading-tight max-w-[120px] truncate">
                    {user.fullName}
                  </span>
                  <span className="text-[10px] text-white/50 capitalize flex items-center gap-1">
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${
                        user.role === 'funder' ? 'bg-violet-400' : 'bg-sky-400'
                      }`}
                    />
                    {user.role}
                  </span>
                </div>
                <UserIcon className="h-3.5 w-3.5 text-white/40" />
              </button>

              {/* Database Settings Modal Trigger */}
              <button
                onClick={onOpenDatabaseSettings}
                className="p-2 rounded-full border border-white/[0.08] bg-white/[0.04] text-white/60 hover:text-white hover:bg-white/[0.08] transition"
                title="Database and GitHub Pages Storage"
                aria-label="Database Settings"
              >
                <Database className="h-3.5 w-3.5" />
              </button>

              {/* Sign Out Button */}
              <button
                onClick={async () => {
                  await logout();
                  setCurrentView('landing');
                }}
                className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[12px] font-medium text-white/70 hover:text-white hover:bg-white/[0.08] transition"
                id="navbar-logout-btn"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Sign Out</span>
              </button>
            </div>
          ) : (
            // Unauthenticated State: Create Account & Login Dropdowns
            <div className="flex items-center gap-2">
              {/* Create Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setCreateDropdownOpen(!createDropdownOpen);
                    setLoginDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-white text-[#0a0a0f] px-4 py-2 text-[13px] font-semibold hover:bg-white/90 transition shadow-sm"
                  id="navbar-create-account-btn"
                >
                  <span>Create Account</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      createDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {createDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#16161d] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-white/40">
                      Select Account Type
                    </div>
                    <button
                      onClick={() => {
                        setCreateDropdownOpen(false);
                        onOpenAuth('register', 'funder');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] hover:bg-white/[0.06] transition text-left text-white"
                      id="register-funder-dropdown-item"
                    >
                      <Shield className="h-4 w-4 text-violet-400 shrink-0" />
                      <div>
                        <div className="font-medium leading-tight">Funder Account</div>
                        <div className="text-[11px] text-white/50">Manage grants & funding windows</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setCreateDropdownOpen(false);
                        onOpenAuth('register', 'awardee');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] hover:bg-white/[0.06] transition text-left text-white"
                      id="register-awardee-dropdown-item"
                    >
                      <Globe className="h-4 w-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-medium leading-tight">Awardee Account</div>
                        <div className="text-[11px] text-white/50">Browse & apply for funding</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Login Dropdown */}
              <div className="relative">
                <button
                  onClick={() => {
                    setLoginDropdownOpen(!loginDropdownOpen);
                    setCreateDropdownOpen(false);
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-white/[0.05] px-4 py-2 text-[13px] font-medium hover:bg-white/[0.08] transition text-white"
                  id="navbar-login-btn"
                >
                  <span>Login</span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${
                      loginDropdownOpen ? 'rotate-180' : ''
                    }`}
                  />
                </button>

                {loginDropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-56 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#16161d] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-3 py-1.5 text-[10.5px] font-medium uppercase tracking-wider text-white/40">
                      Sign In To Workspace
                    </div>
                    <button
                      onClick={() => {
                        setLoginDropdownOpen(false);
                        onOpenAuth('login', 'funder');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] hover:bg-white/[0.06] transition text-left text-white"
                      id="login-funder-dropdown-item"
                    >
                      <LayoutDashboard className="h-4 w-4 text-violet-400 shrink-0" />
                      <div>
                        <div className="font-medium leading-tight">Funder Login</div>
                        <div className="text-[11px] text-white/50">Access grant review center</div>
                      </div>
                    </button>
                    <button
                      onClick={() => {
                        setLoginDropdownOpen(false);
                        onOpenAuth('login', 'awardee');
                      }}
                      className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-[13px] hover:bg-white/[0.06] transition text-left text-white"
                      id="login-awardee-dropdown-item"
                    >
                      <FileText className="h-4 w-4 text-sky-400 shrink-0" />
                      <div>
                        <div className="font-medium leading-tight">Awardee Login</div>
                        <div className="text-[11px] text-white/50">Submit applications & track status</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
