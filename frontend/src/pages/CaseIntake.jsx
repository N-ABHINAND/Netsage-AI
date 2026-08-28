import React, { useState, useEffect } from 'react';
import { Network, Search, PlusCircle, Sparkles, CheckCircle2, ShieldCheck, FileText, Cpu } from 'lucide-react';

export default function CaseIntake({ onSelectCase }) {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Custom intake state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customCategory, setCustomCategory] = useState('VLAN');
  const [customLayer, setCustomLayer] = useState(2);
  const [customSymptom, setCustomSymptom] = useState('');
  const [customTopology, setCustomTopology] = useState('');
  const [customShowOutput, setCustomShowOutput] = useState('');

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cases');
      if (res.ok) {
        const data = await res.json();
        setCases(data);
      }
    } catch (err) {
      console.error('Failed to load cases', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCustomCase = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: customCategory,
          osi_layer: parseInt(customLayer),
          symptom: customSymptom,
          topology_note: customTopology,
          raw_show_output: customShowOutput,
          expected_fault: 'User Custom Case',
          severity: 'HIGH'
        })
      });
      if (res.ok) {
        const newCase = await res.json();
        setShowCustomModal(false);
        onSelectCase(newCase.id);
      }
    } catch (err) {
      console.error('Error creating case', err);
    }
  };

  const categories = ['ALL', 'VLAN', 'DHCP', 'DNS', 'ROUTING', 'ACL', 'NAT', 'WIRELESS', 'INTERFACE'];

  const filteredCases = cases.filter(c => {
    const matchesCat = selectedCategory === 'ALL' || c.category === selectedCategory;
    const matchesQuery = !searchQuery || 
      c.symptom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.expected_fault.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesQuery;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-cyan-950/40 to-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl -z-0 pointer-events-none"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 text-xs font-semibold px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                Phase 1: Deterministic Intake
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Packet Tracer Case Library</h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Select a Packet Tracer fault scenario from the dataset or paste raw show output to trigger deterministic rule parsing + AI diagnosis.
            </p>
          </div>

          <button
            onClick={() => setShowCustomModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded-xl text-sm transition-all shadow-lg shadow-cyan-950"
          >
            <PlusCircle className="w-4 h-4" />
            Paste Custom Case
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-[#0d1627] p-3 rounded-xl border border-slate-800">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 font-semibold shadow-md'
                  : 'bg-slate-800/60 text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Box */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search symptoms or IDs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#080e1b] border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* Case Grid */}
      {loading ? (
        <div className="text-center py-16 bg-[#0b1329] border border-slate-800 rounded-xl">
          <Cpu className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-2" />
          <p className="text-slate-400 text-sm">Loading Packet Tracer Lab Scenarios...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredCases.map(c => (
            <div
              key={c.id}
              onClick={() => onSelectCase(c.id)}
              className="bg-[#0b1426] hover:bg-[#0e1a32] border border-slate-800 hover:border-cyan-500/50 rounded-xl p-4 cursor-pointer transition-all duration-200 shadow-lg group flex flex-col justify-between"
            >
              <div>
                {/* Header row */}
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs text-cyan-400 font-semibold">{c.id}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-slate-800 text-slate-300 border border-slate-700">
                      Layer {c.osi_layer}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-cyan-950 text-cyan-300 border border-cyan-800">
                      {c.category}
                    </span>
                  </div>
                </div>

                {/* Symptom */}
                <h3 className="text-sm font-semibold text-slate-100 group-hover:text-cyan-300 transition-colors line-clamp-2 mb-2">
                  {c.symptom}
                </h3>

                <p className="text-xs text-slate-400 line-clamp-2 font-mono bg-[#070c18] p-2 rounded border border-slate-800/80 mb-3">
                  {c.topology_note || 'Standard Lab Topology'}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-800/80 flex justify-between items-center text-xs">
                <span className="text-slate-500 flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  Show output ready
                </span>
                <span className="text-cyan-400 group-hover:translate-x-1 transition-transform flex items-center gap-1 font-medium text-xs">
                  Run Diagnosis &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Custom Case Intake Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0b1426] border border-slate-700 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-white">Intake Custom Packet Tracer Scenario</h2>
            
            <form onSubmit={handleCreateCustomCase} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-300 mb-1">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-500"
                  >
                    {categories.filter(c => c !== 'ALL').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 mb-1">OSI Layer (1-7)</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    value={customLayer}
                    onChange={(e) => setCustomLayer(e.target.value)}
                    className="w-full bg-[#070d1a] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Symptom Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PC-1 cannot ping Gateway 192.168.1.1"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Topology / Context Note</label>
                <input
                  type="text"
                  placeholder="e.g. Switch-1 connected to Router-1 on Gi0/1"
                  value={customTopology}
                  onChange={(e) => setCustomTopology(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-700 rounded-lg p-2 text-slate-200 focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 mb-1">Raw Show Command Output (Paste here)</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Paste output of 'show ip interface brief', 'show vlan brief', 'show ip route', etc."
                  value={customShowOutput}
                  onChange={(e) => setCustomShowOutput(e.target.value)}
                  className="w-full bg-[#070d1a] border border-slate-700 rounded-lg p-2 font-mono text-slate-200 focus:border-cyan-500"
                ></textarea>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-cyan-500 text-slate-950 font-semibold rounded-lg hover:bg-cyan-400"
                >
                  Run Rule Checker & Diagnose
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
