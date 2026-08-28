import React, { useState } from 'react';
import { Network, ShieldCheck, Lock, LogIn, UserPlus, AlertCircle, KeyRound, Mail, User } from 'lucide-react';

export default function LoginPage({ onLogin }) {
  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  
  // Login Form State
  const [loginIdentifier, setLoginIdentifier] = useState('alex_mercer');
  const [loginPassword, setLoginPassword] = useState('password123');

  // Register Form State
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Senior Network Engineer');

  // UI State
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Handle Login Submit
  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    if (!loginIdentifier || !loginPassword) return;
    
    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username_or_email: loginIdentifier,
          password: loginPassword
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      // Store JWT token and pass user session up
      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        onLogin({
          id: data.user.id,
          name: data.user.username,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.username}`,
          authMethod: 'JWT Bearer Authentication',
          token: data.access_token
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Login failed. Check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Registration Submit
  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    if (!regEmail || !regUsername || !regPassword) return;

    setLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: regEmail,
          username: regUsername,
          password: regPassword,
          role: regRole
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Registration failed');
      }

      if (data.access_token) {
        localStorage.setItem('token', data.access_token);
        onLogin({
          id: data.user.id,
          name: data.user.username,
          username: data.user.username,
          email: data.user.email,
          role: data.user.role,
          avatar: `https://api.dicebear.com/7.x/bottts/svg?seed=${data.user.username}`,
          authMethod: 'JWT Bearer Authentication',
          token: data.access_token
        });
      }
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  // Demo user quick-fill helper
  const handleFillDemo = (username, password) => {
    setActiveTab('login');
    setLoginIdentifier(username);
    setLoginPassword(password);
    setErrorMessage('');
  };

  return (
    <div className="min-h-screen bg-[#060a14] text-slate-100 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none -z-0"></div>
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none -z-0"></div>

      <div className="max-w-md w-full relative z-10 space-y-5">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-cyan-600 to-cyan-400 rounded-2xl shadow-xl shadow-cyan-950/80 mb-2">
            <Network className="w-8 h-8 text-slate-950 stroke-[2.5]" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">NetSage AI Console</h1>
          <p className="text-xs text-slate-400 font-mono">
            Packet Tracer Troubleshooting Assistant & Responsible AI Log
          </p>
        </div>

        {/* Safety Guardrail Badge */}
        <div className="bg-[#0b1426] border border-slate-800 rounded-xl p-3 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
          <p className="text-[11px] text-slate-300">
            <strong>JWT Secured Session:</strong> Authenticate with Email, Username, and Password to verify diagnoses in the audit log.
          </p>
        </div>

        {/* Authentication Card */}
        <div className="bg-[#0b1426]/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
          
          {/* Tab Switcher: Sign In vs Create Account */}
          <div className="flex bg-[#070d1a] p-1 rounded-xl border border-slate-800 text-xs font-semibold">
            <button
              type="button"
              onClick={() => { setActiveTab('login'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'login'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </button>
            <button
              type="button"
              onClick={() => { setActiveTab('register'); setErrorMessage(''); }}
              className={`flex-1 py-2 rounded-lg transition-all flex items-center justify-center gap-2 ${
                activeTab === 'register'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Register</span>
            </button>
          </div>

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-200 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* SIGN IN FORM */}
          {activeTab === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email or Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="alex_mercer or alex.mercer@net-labs.com"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <KeyRound className="w-4 h-4" />
                <span>{loading ? 'Authenticating Token...' : 'Sign In with JWT'}</span>
              </button>
            </form>
          )}

          {/* REGISTER FORM */}
          {activeTab === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    placeholder="engineer@network.corp"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. jsmith_net"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="Minimum 6 characters"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700/80 rounded-xl pl-9 pr-3 py-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Engineering Role</label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-slate-200 focus:border-cyan-500"
                >
                  <option value="Senior Network Engineer">Senior Network Engineer</option>
                  <option value="Lead Security & VLAN Specialist">Lead Security & VLAN Specialist</option>
                  <option value="Infrastructure Architect">Infrastructure Architect</option>
                  <option value="Network Operations Reviewer">Network Operations Reviewer</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 mt-2 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Registering Account...' : 'Create Account & Get JWT'}</span>
              </button>
            </form>
          )}

          {/* Quick Demo Accounts */}
          <div className="pt-3 border-t border-slate-800/80 text-[11px] space-y-2">
            <span className="text-slate-400 font-medium block">Quick Fill Demo Accounts:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => handleFillDemo('alex_mercer', 'password123')}
                className="p-2 bg-[#070d1a] hover:bg-[#0d1830] border border-slate-700/80 rounded-lg text-left transition-all group"
              >
                <span className="block font-semibold text-slate-200 group-hover:text-cyan-400">alex_mercer</span>
                <span className="block text-[10px] text-slate-400 font-mono">password123</span>
              </button>
              <button
                type="button"
                onClick={() => handleFillDemo('sarah_jenkins', 'password123')}
                className="p-2 bg-[#070d1a] hover:bg-[#0d1830] border border-slate-700/80 rounded-lg text-left transition-all group"
              >
                <span className="block font-semibold text-slate-200 group-hover:text-cyan-400">sarah_jenkins</span>
                <span className="block text-[10px] text-slate-400 font-mono">password123</span>
              </button>
            </div>
          </div>

        </div>

        {/* Footer info */}
        <p className="text-[11px] text-center text-slate-500 font-mono">
          NetSage AI v1.0 &bull; JWT Signed Bearer Token Security
        </p>
      </div>
    </div>
  );
}
