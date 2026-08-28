import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  Edit3,
  Terminal,
  ShieldCheck,
  Zap,
  AlertOctagon,
  Layers,
  FileCheck,
  ExternalLink
} from 'lucide-react';
import EvidenceCard from '../components/EvidenceCard';
import ConfidenceBadge from '../components/ConfidenceBadge';

export default function DiagnosisReview({ caseId, onBack, onReviewSubmitted, user }) {
  const [caseData, setCaseData] = useState(null);
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [diagnosing, setDiagnosing] = useState(false);

  // Review modal state
  const [verdictType, setVerdictType] = useState(null); // 'accepted', 'edited', 'rejected'
  const [rejectReason, setRejectReason] = useState('wrong_root_cause');
  const [editedRootCause, setEditedRootCause] = useState('');
  const [reviewerNote, setReviewerNote] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    if (caseId) {
      loadCaseAndDiagnose();
    }
  }, [caseId]);

  const loadCaseAndDiagnose = async () => {
    setLoading(true);
    try {
      // 1. Fetch Case detail
      const caseRes = await fetch(`/api/cases/${caseId}`);
      if (!caseRes.ok) throw new Error('Failed to fetch case');
      const cData = await caseRes.json();
      setCaseData(cData);

      // 2. Trigger Diagnosis
      setDiagnosing(true);
      const diagRes = await fetch(`/api/cases/${caseId}/diagnose`, { method: 'POST' });
      if (!diagRes.ok) throw new Error('Failed to run diagnosis');
      const dData = await diagRes.json();
      setDiagnosis(dData);
      setEditedRootCause(dData.root_cause);
    } catch (err) {
      console.error('Error in diagnosis flow', err);
    } finally {
      setLoading(false);
      setDiagnosing(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!verdictType) return;
    setSubmittingReview(true);
    try {
      const authorInfo = user ? `[Verified: ${user.name} (${user.role})] ` : '';
      const finalNote = authorInfo + (reviewerNote || 'Reviewed and verified in Packet Tracer console.');

      const token = user?.token || localStorage.getItem('token');
      const headers = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/cases/${caseId}/review?diagnosis_id=${diagnosis.id}`, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify({
          verdict: verdictType,
          reason: verdictType === 'rejected' ? rejectReason : null,
          reviewer_note: finalNote,
          edited_root_cause: verdictType === 'edited' ? editedRootCause : null
        })
      });

      if (res.ok) {
        setReviewSuccess(true);
        setTimeout(() => {
          if (onReviewSubmitted) onReviewSubmitted();
        }, 1200);
      }
    } catch (err) {
      console.error('Failed to submit review', err);
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading || diagnosing) {
    return (
      <div className="bg-[#0b1329] border border-slate-800 rounded-2xl p-16 text-center space-y-4">
        <div className="relative w-16 h-16 mx-auto">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping"></div>
          <Zap className="w-16 h-16 text-cyan-400 animate-bounce relative z-10" />
        </div>
        <h2 className="text-xl font-bold text-white">Running Rule Checker & Claude AI Diagnosis...</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          Extracting deterministic findings from show commands, matching VLAN/IP/Subnet rules, and verifying citation evidence lines.
        </p>
      </div>
    );
  }

  if (!caseData || !diagnosis) {
    return (
      <div className="p-8 text-center text-slate-400">
        <p>Case or diagnosis not found.</p>
        <button onClick={onBack} className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg">Back to Library</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Navigation Top Bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Case Intake
        </button>

        <div className="flex items-center gap-3">
          <span className="font-mono text-xs text-slate-400">Case ID: <strong className="text-cyan-400">{caseData.id}</strong></span>
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-cyan-950 text-cyan-300 border border-cyan-800 uppercase">
            {caseData.category}
          </span>
          <span className="px-2.5 py-1 rounded text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
            Layer {caseData.osi_layer}
          </span>
        </div>
      </div>

      {/* Responsible AI Guardrail Banner */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-400 shrink-0" />
          <p className="text-xs text-amber-200">
            <strong>Human-in-the-Loop Active:</strong> NetSage AI provides diagnostic evidence only. No network configuration has been pushed or applied automatically.
          </p>
        </div>
        <span className="text-[11px] font-mono font-semibold uppercase text-amber-400 bg-amber-950/60 px-2 py-1 rounded border border-amber-800/60">
          Guardrail Enforced
        </span>
      </div>

      {/* Main Grid: Left = AI Diagnosis + Deterministic Findings, Right = Evidence Terminal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Diagnosis & Fix Steps (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* AI Root Cause Card */}
          <div className="bg-[#0b1426] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <FileCheck className="w-4 h-4" />
                AI Evidence-Backed Diagnosis
              </h2>
              <ConfidenceBadge confidence={diagnosis.confidence} />
            </div>

            <div className="bg-[#070d1a] border border-slate-800 rounded-xl p-4">
              <label className="block text-[11px] font-mono text-slate-500 uppercase mb-1">Diagnosed Root Cause</label>
              <p className="text-base font-semibold text-slate-100 leading-relaxed">
                {diagnosis.root_cause}
              </p>
            </div>

            {/* Deterministic Rule Engine Findings */}
            {diagnosis.findings && diagnosis.findings.length > 0 && (
              <div>
                <label className="block text-[11px] font-mono text-slate-400 uppercase mb-2">
                  Deterministic Rule Engine Flags ({diagnosis.findings.length})
                </label>
                <div className="space-y-2">
                  {diagnosis.findings.map((f, i) => (
                    <div key={i} className="bg-slate-900/80 border border-slate-800 rounded-lg p-2.5 flex items-start gap-2 text-xs">
                      <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-bold">
                            {f.rule_id}
                          </span>
                          <span className="font-semibold text-slate-200">{f.description}</span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-400 mt-1 bg-[#050914] p-1 rounded border border-slate-800">
                          {f.evidence_line}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Verification Command */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-1.5">Recommended Verification Command</label>
              <div className="bg-[#050914] border border-slate-800 rounded-lg p-3 font-mono text-xs text-cyan-300 flex items-center justify-between">
                <span>{diagnosis.next_command}</span>
                <span className="text-[10px] text-slate-500 uppercase font-sans">Run in Packet Tracer CLI</span>
              </div>
            </div>

            {/* Remediation Steps */}
            <div>
              <label className="block text-[11px] font-mono text-slate-400 uppercase mb-2">Ordered Remediation Guide</label>
              <ol className="space-y-2 text-xs">
                {diagnosis.fix_steps.map((step, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                    <span className="w-5 h-5 rounded-full bg-cyan-500/20 text-cyan-400 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>
                    <span className="text-slate-200 pt-0.5 font-mono">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          </div>

          {/* Human Approval Review Panel */}
          <div className="bg-[#0e1930] border border-slate-700/80 rounded-2xl p-6 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Human Reviewer Approval Action
            </h3>
            <p className="text-xs text-slate-400">
              Select your verdict to apply this recommendation or record a rejection in the immutable Responsible AI log.
            </p>

            {reviewSuccess ? (
              <div className="bg-emerald-500/20 border border-emerald-500/40 rounded-xl p-4 text-center space-y-1">
                <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="font-bold text-emerald-300 text-sm">Verdict Logged in Audit Trail!</h4>
                <p className="text-xs text-emerald-200">Updating dashboard calibration statistics...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Action Buttons */}
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setVerdictType('accepted')}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      verdictType === 'accepted'
                        ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-950 font-bold ring-2 ring-emerald-300'
                        : 'bg-slate-900 hover:bg-emerald-950/40 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <CheckCircle className="w-5 h-5 text-emerald-400" />
                    Accept Fix
                  </button>

                  <button
                    onClick={() => setVerdictType('edited')}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      verdictType === 'edited'
                        ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950 font-bold ring-2 ring-amber-300'
                        : 'bg-slate-900 hover:bg-amber-950/40 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <Edit3 className="w-5 h-5 text-amber-400" />
                    Edit Cause
                  </button>

                  <button
                    onClick={() => setVerdictType('rejected')}
                    className={`py-3 px-4 rounded-xl text-xs font-semibold flex flex-col items-center justify-center gap-1.5 transition-all ${
                      verdictType === 'rejected'
                        ? 'bg-rose-500 text-white shadow-lg shadow-rose-950 font-bold ring-2 ring-rose-300'
                        : 'bg-slate-900 hover:bg-rose-950/40 text-slate-300 border border-slate-700'
                    }`}
                  >
                    <XCircle className="w-5 h-5 text-rose-400" />
                    Reject Diagnosis
                  </button>
                </div>

                {/* Edit Form */}
                {verdictType === 'edited' && (
                  <div className="bg-[#070d1a] p-4 rounded-xl border border-amber-500/30 space-y-2">
                    <label className="block text-xs text-amber-300 font-semibold">Corrected Root Cause Description</label>
                    <textarea
                      rows="3"
                      value={editedRootCause}
                      onChange={(e) => setEditedRootCause(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-amber-500"
                    ></textarea>
                  </div>
                )}

                {/* Reject Form (Mandatory Reason Field - Section 7) */}
                {verdictType === 'rejected' && (
                  <div className="bg-[#070d1a] p-4 rounded-xl border border-rose-500/30 space-y-3">
                    <div>
                      <label className="block text-xs text-rose-300 font-semibold mb-1">
                        Mandatory Rejection Reason *
                      </label>
                      <select
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-100 focus:border-rose-500"
                      >
                        <option value="wrong_root_cause">Wrong Root Cause</option>
                        <option value="wrong_evidence">Wrong Evidence Cited</option>
                        <option value="low_confidence_justified">Low Confidence Justified</option>
                        <option value="other">Other / Ambiguous Scenario</option>
                      </select>
                    </div>
                  </div>
                )}

                {/* Optional Reviewer Note */}
                {verdictType && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Reviewer Engineering Note (Optional)</label>
                      <input
                        type="text"
                        placeholder="Add context for model audit history..."
                        value={reviewerNote}
                        onChange={(e) => setReviewerNote(e.target.value)}
                        className="w-full bg-[#070d1a] border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:border-cyan-500"
                      />
                    </div>

                    <button
                      onClick={handleSubmitReview}
                      disabled={submittingReview}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                    >
                      {submittingReview ? 'Writing to Responsible AI Log...' : `Submit ${verdictType.toUpperCase()} Verdict`}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Console Show Output & Highlighted Cited Evidence (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0b1426] border border-slate-800 rounded-2xl p-4 shadow-xl">
            <h3 className="text-xs font-mono font-semibold text-slate-300 uppercase mb-3 flex items-center justify-between">
              <span>Symptom & Topology</span>
              <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded">Case Context</span>
            </h3>
            
            <div className="space-y-2 text-xs">
              <div className="bg-[#070d1a] p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block text-[10px] uppercase font-mono">Reported Symptom</span>
                <p className="text-slate-200 font-semibold mt-0.5">{caseData.symptom}</p>
              </div>

              {caseData.topology_note && (
                <div className="bg-[#070d1a] p-3 rounded-lg border border-slate-800">
                  <span className="text-slate-500 block text-[10px] uppercase font-mono">Topology Context</span>
                  <p className="text-slate-300 font-mono text-[11px] mt-0.5">{caseData.topology_note}</p>
                </div>
              )}
            </div>
          </div>

          <EvidenceCard
            rawOutput={caseData.raw_show_output}
            evidence={diagnosis.evidence}
            findings={diagnosis.findings}
          />
        </div>

      </div>
    </div>
  );
}
