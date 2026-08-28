import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, CheckCircle2, XCircle, Edit3, ArrowRight, User, Terminal, Calendar } from 'lucide-react';
import ConfidenceBadge from '../components/ConfidenceBadge';

export default function UserHistory({ user, onSelectCase }) {
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterVerdict, setFilterVerdict] = useState('ALL');

  useEffect(() => {
    fetchUserHistory();
  }, [user]);

  const fetchUserHistory = async () => {
    setLoading(true);
    try {
      const token = user?.token || localStorage.getItem('token');
      const headers = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const emailParam = user?.email ? `?email=${encodeURIComponent(user.email)}` : '';
      const res = await fetch(`/api/user-history${emailParam}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setHistoryItems(data);
      }
    } catch (err) {
      console.error('Failed to load user history', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredHistory = historyItems.filter(item => {
    if (filterVerdict === 'ALL') return true;
    return item.verdict.toLowerCase() === filterVerdict.toLowerCase();
  });

  return (
    <div className="space-y-6">
      {/* Account Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <img
              src={user.avatar}
              alt={user.name}
              className="w-14 h-14 rounded-2xl border-2 border-cyan-500/40 bg-slate-800 object-cover shadow-lg"
            />
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-xl font-bold text-white tracking-tight">{user.name}'s Account History</h1>
                <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full uppercase">
                  {user.authMethod}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {user.email} &bull; <strong className="text-cyan-400">{user.role}</strong>
              </p>
            </div>
          </div>

          <div className="bg-[#070d1a] border border-slate-800 rounded-xl px-4 py-2 text-right">
            <span className="text-[10px] uppercase font-mono text-slate-400 block">Total Diagnoses Reviewed</span>
            <span className="text-xl font-bold text-cyan-400">{historyItems.length} Cases Checked</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 bg-[#0d1627] p-2 rounded-xl border border-slate-800">
        <span className="text-xs text-slate-400 font-mono px-2">Filter Activity:</span>
        {['ALL', 'ACCEPTED', 'EDITED', 'REJECTED'].map(verdict => (
          <button
            key={verdict}
            onClick={() => setFilterVerdict(verdict)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              filterVerdict === verdict
                ? 'bg-cyan-500 text-slate-950 shadow-md'
                : 'bg-slate-800/60 text-slate-400 hover:text-white'
            }`}
          >
            {verdict}
          </button>
        ))}
      </div>

      {/* History Items List */}
      {loading ? (
        <div className="text-center py-16 bg-[#0b1329] border border-slate-800 rounded-xl">
          <History className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Loading Account Activity Log...</p>
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-16 bg-[#0b1329] border border-slate-800 rounded-xl p-6 text-slate-400 space-y-3">
          <History className="w-10 h-10 text-cyan-500/60 mx-auto" />
          <h3 className="text-base font-semibold text-slate-200">No Reviewed Cases Yet</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            You haven't reviewed any fault scenarios yet under this account. Head over to <strong>1. Case Intake</strong> to run a diagnosis and submit your review!
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredHistory.map((item) => (
            <div
              key={item.review_id}
              className="bg-[#0b1426] border border-slate-800 hover:border-slate-700 rounded-xl p-5 shadow-lg space-y-3 transition-all"
            >
              {/* Header row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-cyan-400">{item.case_id}</span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
                    {item.category}
                  </span>
                  <span className="px-2.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                    Layer {item.osi_layer}
                  </span>
                  <ConfidenceBadge confidence={item.confidence} />
                </div>

                <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                  <Calendar className="w-3.5 h-3.5 text-slate-500" />
                  <span>{item.timestamp}</span>
                </div>
              </div>

              {/* Symptom & Diagnosis details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="bg-[#070d1a] p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-slate-500 block mb-1">Checked Symptom</span>
                  <p className="font-semibold text-slate-200">{item.symptom}</p>
                </div>

                <div className="bg-[#070d1a] p-3 rounded-lg border border-slate-800/80">
                  <span className="text-[10px] uppercase font-mono text-cyan-400 block mb-1">AI Root Cause Diagnosis</span>
                  <p className="font-medium text-slate-300">{item.diagnosis_root_cause}</p>
                </div>
              </div>

              {/* Review verdict & Action row */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">User Review Verdict:</span>
                  <span className={`px-2.5 py-1 rounded text-xs font-bold uppercase ${
                    item.verdict === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                    item.verdict === 'edited' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                    'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                  }`}>
                    {item.verdict}
                  </span>
                  {item.reason && item.reason !== '-' && (
                    <span className="text-slate-400 font-sans">({item.reason})</span>
                  )}
                </div>

                <button
                  onClick={() => onSelectCase(item.case_id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-semibold rounded-lg transition-all"
                >
                  <span>Inspect Case Console & Line Citations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}
