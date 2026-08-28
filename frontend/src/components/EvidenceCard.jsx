import React from 'react';
import { Terminal, CheckCircle2, AlertCircle } from 'lucide-react';

export default function EvidenceCard({ rawOutput, evidence = [], findings = [] }) {
  const lines = (rawOutput || '').split('\n');

  // Helper to check if line is cited as evidence
  const isEvidenceLine = (line) => {
    if (!line.strip) line = line.trim();
    if (!line) return false;
    return evidence.some(e => e.trim().length > 5 && (line.includes(e.trim()) || e.trim().includes(line)));
  };

  return (
    <div className="bg-[#0b1426] border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Console Header */}
      <div className="bg-[#0d1830] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-cyan-400" />
          <span className="text-xs font-mono text-slate-300 font-semibold">Console Show Output</span>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] font-mono text-cyan-400 bg-cyan-950/50 px-2 py-0.5 rounded border border-cyan-800/50">
          <span>{evidence.length} Evidence Line(s) Grounded</span>
        </div>
      </div>

      {/* Raw Output Terminal with Line Highlighting */}
      <div className="p-4 font-mono text-xs overflow-x-auto max-h-[380px] leading-relaxed bg-[#070d1a]">
        {lines.map((line, idx) => {
          const highlighted = isEvidenceLine(line);
          return (
            <div
              key={idx}
              className={`py-0.5 px-2 rounded font-mono transition-colors flex items-start gap-2 ${
                highlighted
                  ? 'bg-amber-500/20 text-amber-200 border-l-4 border-amber-400 font-semibold my-0.5'
                  : 'text-slate-300 hover:bg-slate-900/50'
              }`}
            >
              <span className="text-slate-600 select-none text-[10px] w-6 text-right shrink-0">{idx + 1}</span>
              <span className="whitespace-pre flex-1">{line}</span>
              {highlighted && (
                <span className="shrink-0 text-[10px] uppercase font-sans tracking-wider bg-amber-400/20 text-amber-300 px-1.5 py-0.2 rounded border border-amber-500/30">
                  CITED EVIDENCE
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
