import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { LandingPage } from './components/landing/LandingPage';
import { FunderDashboard } from './components/funder/FunderDashboard';
import { AwardeeDashboard } from './components/awardee/AwardeeDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { UserProfileModal } from './components/auth/UserProfileModal';
import { FundingWindow, UserRole, ViewMode, AwardeeTab } from './types';
import { db } from './lib/db';

const EqualGrantApp: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

  // Navigation / View State
  const [activeView, setActiveView] = useState<ViewMode>('landing');
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  // Funding Windows Data
  const [fundingWindows, setFundingWindows] = useState<FundingWindow[]>([]);
  const [selectedCall, setSelectedCall] = useState<FundingWindow | null>(null);
  const [awardeeInitialTab, setAwardeeInitialTab] = useState<AwardeeTab>('browse');

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState<boolean>(false);
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [authInitialRole, setAuthInitialRole] = useState<UserRole>('funder');
  const [profileModalOpen, setProfileModalOpen] = useState<boolean>(false);

  // Live timer ticking every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Funding Windows from DB
  const refreshFundingWindows = async () => {
    const windows = await db.getFundingWindows();
    setFundingWindows(windows);
  };

  useEffect(() => {
    refreshFundingWindows();
  }, []);

  // Role selection handling
  const handleSelectRole = (role: UserRole) => {
    if (!isAuthenticated) {
      setAuthInitialRole(role);
      setAuthInitialMode('login');
      setAuthModalOpen(true);
      return;
    }

    if (role === 'funder') {
      setActiveView('funder');
    } else {
      setActiveView('awardee');
      setAwardeeInitialTab('browse');
    }
  };

  // Direct Apply Call from landing page
  const handleApplyCall = (call: FundingWindow) => {
    setSelectedCall(call);
    setActiveView('awardee');
    setAwardeeInitialTab('apply');
  };

  // Open Auth Modal helper
  const handleOpenAuth = (mode: 'login' | 'register', role: UserRole = 'funder') => {
    setAuthInitialMode(mode);
    setAuthInitialRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="relative min-h-screen text-white flex flex-col selection:bg-violet-500/30 selection:text-white">
      {/* Background Graphic: fitted to the landing page and entire application */}
      <div
        className={`fixed inset-0 pointer-events-none -z-20 bg-cover bg-center bg-no-repeat transition-all duration-700 ${
          activeView === 'landing' ? 'opacity-15 scale-100' : 'opacity-40 scale-105'
        }`}
        style={{
          backgroundImage: `url('/assets/system_bg.jpg')`,
        }}
        id="system-background-canvas"
      />
      {/* Dynamic overlay: lighter, clearer view on landing page to showcase graphic, deeper in workspace */}
      <div
        className={`fixed inset-0 pointer-events-none -z-10 transition-colors duration-500 ${
          activeView === 'landing'
            ? 'bg-gradient-to-b from-[#080d24]/85 via-[#080c1e]/92 to-[#070914]/97'
            : 'bg-[#080a14]/85 backdrop-blur-[2px]'
        }`}
      />

      {/* Main Navbar */}
      <Navbar
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={() => setProfileModalOpen(true)}
      />

      {/* Content based on Active View */}
      <div className="flex-1">
        {activeView === 'landing' && (
          <LandingPage
            fundingWindows={fundingWindows}
            currentTime={currentTime}
            onSelectRole={handleSelectRole}
            onApplyCall={handleApplyCall}
            onCreateCallRedirect={() => {
              if (isAuthenticated && user?.role === 'funder') {
                setActiveView('funder');
              } else {
                handleOpenAuth('login', 'funder');
              }
            }}
          />
        )}

        {activeView === 'funder' && (
          <FunderDashboard
            fundingWindows={fundingWindows}
            onRefreshWindows={refreshFundingWindows}
            currentTime={currentTime}
          />
        )}

        {activeView === 'awardee' && (
          <AwardeeDashboard
            fundingWindows={fundingWindows}
            selectedCall={selectedCall}
            setSelectedCall={setSelectedCall}
            currentTime={currentTime}
            initialTab={awardeeInitialTab}
            onRequireAuth={() => handleOpenAuth('login', 'awardee')}
          />
        )}
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authInitialMode}
        initialRole={authInitialRole}
        onSuccess={() => {
          if (authInitialRole === 'funder') {
            setActiveView('funder');
          } else {
            setActiveView('awardee');
          }
        }}
      />

      {/* User Profile & Security Modal */}
      <UserProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <EqualGrantApp />
    </AuthProvider>
  );
}
