import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ConfidenceBadge({ confidence }) {
  const level = (confidence || 'medium').toLowerCase();

  if (level === 'high') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm shadow-emerald-950">
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        HIGH CONFIDENCE
      </span>
    );
  }

  if (level === 'low') {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 shadow-sm shadow-rose-950">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
        LOW CONFIDENCE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/30 shadow-sm shadow-amber-950">
      <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
      MEDIUM CONFIDENCE
    </span>
  );
}
