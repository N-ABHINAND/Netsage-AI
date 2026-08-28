import React, { useState, useEffect } from 'react';
import { Network, Activity, FileSearch, LayoutDashboard, ShieldCheck, LogOut, History, KeyRound } from 'lucide-react';
import CaseIntake from './pages/CaseIntake';
import DiagnosisReview from './pages/DiagnosisReview';
import Dashboard from './pages/Dashboard';
import LoginPage from './pages/LoginPage';
import UserHistory from './pages/UserHistory';

export default function App() {
  const [user, setUser] = useState(null);
  const [authChecking, setAuthChecking] = useState(true);
  const [activeTab, setActiveTab] = useState('intake'); // 'intake', 'review', 'dashboard', 'history'
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  // Validate JWT token on app load
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setAuthChecking(false);
      return;
    }

    fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) throw new Error('Token expired or invalid');
        return res.json();
      })
      .then(data => {
        setUser({
          id: data.id,
          name: data.username,
          username: data.username,
          email: data.email,
          role: data.role,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.username}`,
          authMethod: 'JWT Bearer Authentication',
          token: token
        });
      })
      .catch(() => {
        localStorage.removeItem('token');
        setUser(null);
      })
      .finally(() => {
        setAuthChecking(false);
      });
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const handleSelectCase = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('review');
  };

  const handleReviewSubmitted = () => {
    setActiveTab('dashboard');
  };

  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#060a14] text-slate-100 flex items-center justify-center font-mono text-xs">
        <div className="flex items-center gap-2">
          <KeyRound className="w-5 h-5 text-cyan-400 animate-spin" />
          <span>Verifying JWT Session Token...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-[#080d1a] text-slate-100 flex flex-col font-sans">
      {/* Top Console Navigation Bar */}
      <header className="bg-[#0b1329] border-b border-slate-800 sticky top-0 z-40 shadow-xl backdrop-blur-md bg-opacity-95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-xl shadow-lg shadow-cyan-950/50">
              <Network className="w-5 h-5 text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-white tracking-wide">NetSage AI</h1>
                <span className="bg-cyan-500/20 text-cyan-400 text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-cyan-500/30 uppercase">
                  Packet Tracer Assistant
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">Deterministic Rules + Line Citation AI</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center gap-1 bg-[#060a14] p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('intake')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'intake'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <FileSearch className="w-4 h-4" />
              1. Case Intake
            </button>

            <button
              onClick={() => {
                if (selectedCaseId) setActiveTab('review');
              }}
              disabled={!selectedCaseId}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'review'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : selectedCaseId
                  ? 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                  : 'text-slate-600 cursor-not-allowed'
              }`}
            >
              <Activity className="w-4 h-4" />
              2. Diagnosis Review
            </button>

            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              3. Dashboard
            </button>

            <button
              onClick={() => setActiveTab('history')}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'history'
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <History className="w-4 h-4 text-amber-400" />
              4. My Account History
            </button>
          </nav>

          {/* Authenticated User Identity Widget */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2.5 bg-[#060a14] pl-2 pr-3 py-1.5 rounded-xl border border-slate-800">
              <img
                src={user.avatar}
                alt={user.name}
                className="w-7 h-7 rounded-lg object-cover border border-cyan-500/30 bg-slate-800"
              />
              <div className="text-left hidden sm:block">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-semibold text-white">{user.name}</span>
                  <span className="text-[9px] bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 px-1.5 py-0.2 rounded font-mono font-bold">
                    JWT Signed
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono block leading-none">
                  {user.email}
                </span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              title="Sign Out"
              className="p-2 text-slate-400 hover:text-rose-400 bg-[#060a14] hover:bg-rose-950/40 border border-slate-800 hover:border-rose-800/50 rounded-xl transition-all"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

        </div>
      </header>

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        {activeTab === 'intake' && (
          <CaseIntake onSelectCase={handleSelectCase} />
        )}

        {activeTab === 'review' && selectedCaseId && (
          <DiagnosisReview
            caseId={selectedCaseId}
            onBack={() => setActiveTab('intake')}
            onReviewSubmitted={handleReviewSubmitted}
            user={user}
          />
        )}

        {activeTab === 'dashboard' && (
          <Dashboard />
        )}

        {activeTab === 'history' && (
          <UserHistory
            user={user}
            onSelectCase={handleSelectCase}
          />
        )}
      </main>

      <footer className="border-t border-slate-800/80 bg-[#060a14] py-3 text-center text-xs font-mono text-slate-500">
        NetSage AI &copy; 2026 — Packet Tracer Troubleshooting Assistant & Responsible AI Dashboard &bull; JWT Session: {user.email}
      </footer>
    </div>
  );
}
