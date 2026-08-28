import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Activity,
  History,
  FileCheck2,
  RefreshCw
} from 'lucide-react';
import CalibrationChart from '../components/CalibrationChart';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/dashboard/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
    } finally {
      setLoading(false);
    }
  };

  const VERDICT_COLORS = {
    Accepted: '#10b981',
    Edited: '#f59e0b',
    Rejected: '#ef4444'
  };

  if (loading) {
    return (
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-16 text-center space-y-3">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-slate-400 text-sm">Aggregating Responsible AI Metrics...</p>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-12 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h3 className="text-lg font-bold text-white">Dashboard Data Loading</h3>
        <p className="text-slate-400 text-xs max-w-md mx-auto">
          Connecting to NetSage AI backend services to aggregate metrics.
        </p>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow-lg transition-all inline-flex items-center gap-2"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Reload Dashboard Metrics</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Guardrail Banner (Section 9 requirement) */}
      <div className="bg-gradient-to-r from-[#0d1b38] via-[#09152b] to-[#0d1b38] border border-cyan-500/30 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-cyan-500/10 border border-cyan-500/30 rounded-xl text-cyan-400 shrink-0 mt-0.5">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider">
                Responsible AI & Safety Operational Guardrail
              </h2>
              <span className="bg-cyan-500/20 text-cyan-300 text-[10px] font-mono px-2 py-0.5 rounded border border-cyan-500/30">
                POLICY v1.0
              </span>
            </div>
            <blockquote className="text-xs text-slate-300 italic leading-relaxed">
              "NetSage AI can diagnose and recommend. It cannot configure a device. Every fix requires a human to read the evidence, agree with the reasoning, and apply the change themselves. Every rejection is logged and feeds back into how the team evaluates the model."
            </blockquote>
          </div>
        </div>
      </div>

      {/* Top Stat KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#0b1426] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400">Total Scenarios</span>
            <div className="text-2xl font-bold text-white mt-0.5">{stats.total_cases}</div>
          </div>
          <div className="p-2.5 bg-blue-500/10 text-blue-400 rounded-lg">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b1426] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400">AI Diagnoses Run</span>
            <div className="text-2xl font-bold text-white mt-0.5">{stats.total_diagnoses}</div>
          </div>
          <div className="p-2.5 bg-cyan-500/10 text-cyan-400 rounded-lg">
            <Activity className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b1426] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400">Human Reviews Logged</span>
            <div className="text-2xl font-bold text-white mt-0.5">{stats.total_reviews}</div>
          </div>
          <div className="p-2.5 bg-amber-500/10 text-amber-400 rounded-lg">
            <History className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-[#0b1426] border border-slate-800 rounded-xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-mono uppercase text-slate-400">Agreement Rate</span>
            <div className="text-2xl font-bold text-emerald-400 mt-0.5">{stats.agreement_rate}%</div>
          </div>
          <div className="p-2.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3 Main Charts (Section 8 requirements) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Visual 1: Issue-Type Breakdown (5 cols) */}
        <div className="lg:col-span-4 bg-[#0b1426] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase text-slate-300 font-semibold mb-1">
              Issue-Type Breakdown
            </h3>
            <p className="text-[11px] text-slate-400 mb-4">Distribution of cases across OSI categories</p>
          </div>
          <div className="w-full h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.category_breakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="category" stroke="#94a3b8" fontSize={10} interval={0} />
                <YAxis stroke="#94a3b8" fontSize={11} />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Bar dataKey="count" fill="#00bceb" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 2: AI vs Human Agreement Rate (3 cols) */}
        <div className="lg:col-span-4 bg-[#0b1426] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-mono uppercase text-slate-300 font-semibold mb-1">
              AI vs Human Verdict Rate
            </h3>
            <p className="text-[11px] text-slate-400 mb-2">Accepted vs Edited vs Rejected proportion</p>
          </div>
          
          <div className="w-full h-56 flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.verdict_breakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="count"
                  nameKey="verdict"
                >
                  {stats.verdict_breakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={VERDICT_COLORS[entry.verdict] || '#94a3b8'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px' }} />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#cbd5e1' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Visual 3: Confidence Calibration Chart (4 cols) */}
        <div className="lg:col-span-4 bg-[#0b1426] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-xs font-mono uppercase text-cyan-400 font-semibold">
                Confidence Calibration
              </h3>
              <span className="text-[10px] bg-cyan-950 text-cyan-300 px-2 py-0.5 rounded font-mono">Senior Engineer Calibration</span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Acceptance % across High, Medium, and Low AI confidence buckets.
            </p>
          </div>

          <CalibrationChart calibrationData={stats.calibration_data} />
        </div>

      </div>

      {/* Immutable Responsible AI Log Table */}
      <div className="bg-[#0b1426] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-cyan-400" />
              Responsible AI Audit Trail Log
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Append-only audit trail recording every diagnosis, confidence rating, reviewer verdict, and rejection reason.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800">
            {stats.recent_reviews.length} Immutable Log Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead className="bg-[#070d1a] border-b border-slate-800 text-slate-400 uppercase font-mono text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Case ID</th>
                <th className="p-3">Category</th>
                <th className="p-3">AI Root Cause</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Verdict</th>
                <th className="p-3">Rejection Reason</th>
                <th className="p-3">Reviewer Note</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {stats.recent_reviews.map((r) => (
                <tr key={r.id} className="hover:bg-[#0e1930]/50 transition-colors font-mono text-[11px]">
                  <td className="p-3 text-slate-500 whitespace-nowrap">{r.timestamp}</td>
                  <td className="p-3 font-semibold text-cyan-400">{r.case_id}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                      {r.category}
                    </span>
                  </td>
                  <td className="p-3 font-sans max-w-xs truncate text-slate-200" title={r.diagnosis_root_cause}>
                    {r.diagnosis_root_cause}
                  </td>
                  <td className="p-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      r.confidence === 'high' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                      r.confidence === 'low' ? 'bg-rose-950 text-rose-400 border border-rose-800' :
                      'bg-amber-950 text-amber-400 border border-amber-800'
                    }`}>
                      {r.confidence}
                    </span>
                  </td>
                  <td className="p-3 capitalize">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      r.verdict === 'accepted' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40' :
                      r.verdict === 'edited' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40' :
                      'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    }`}>
                      {r.verdict}
                    </span>
                  </td>
                  <td className="p-3 font-sans text-slate-400">{r.reason}</td>
                  <td className="p-3 font-sans text-slate-400 max-w-xs truncate">{r.reviewer_note || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
