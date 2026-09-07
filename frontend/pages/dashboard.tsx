import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Search, Database, ArrowRight, RefreshCw, Sparkles, Shield, ExternalLink, Filter } from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';

interface TraceRecord {
  id: string;
  source_wallet: string;
  complaint_id?: string;
  status: string;
  risk_score: number;
  created_at: string;
  target_vasp?: string;
  hops_count?: number;
}

export default function Dashboard() {
  const [traces, setTraces] = useState<TraceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [seeding, setSeeding] = useState(false);

  const fetchTraces = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.get(`${apiUrl}/api/v1/traces`);
      setTraces(response.data || []);
    } catch (err) {
      console.error('Failed to fetch traces:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTraces();
    const interval = setInterval(fetchTraces, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleSeedDemoData = async () => {
    setSeeding(true);
    const toastId = toast.loading('Seeding 3 realistic forensic demo cases...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      // Trigger trace presets
      await axios.post(`${apiUrl}/api/v1/trace`, {
        victim_wallet: '0x98f4a1c5123456789abcdef12345678901234567',
        complaint_id: 'NCRP-2024-PONZI-001',
      });
      await fetchTraces();
      toast.success('Forensic demo scenarios generated!', { id: toastId });
    } catch (err) {
      toast.error('Could not auto-seed data', { id: toastId });
    } finally {
      setSeeding(false);
    }
  };

  const filteredTraces = traces.filter((t) => {
    const matchesSearch =
      (t.source_wallet || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.complaint_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.target_vasp || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.id || '').toLowerCase().includes(searchTerm.toLowerCase());

    if (statusFilter === 'ALL') return matchesSearch;
    return matchesSearch && t.status.toUpperCase() === statusFilter;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Database className="w-5 h-5 text-cyan-400" />
            <h1 className="text-2xl font-black text-white">Forensic Investigation Cases</h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            Active multi-hop attribution records, suspect wallet clusters, and legal freeze directives.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={fetchTraces}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
            title="Refresh Table"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Link
            href="/"
            className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg shadow-cyan-600/30 transition"
          >
            <span>+ New Investigation</span>
          </Link>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by Wallet, NCRP Case ID, or Exchange..."
            className="w-full pl-10 pr-4 py-2 bg-[#0a0f1d] border border-slate-700 rounded-xl text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 flex items-center space-x-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <span>Filter:</span>
          </span>
          {['ALL', 'COMPLETED', 'PROCESSING'].map((f) => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === f
                  ? 'bg-cyan-950 text-cyan-400 border border-cyan-800'
                  : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Cases Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-16 text-center">
            <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-slate-400">Loading active forensic investigations...</p>
          </div>
        ) : filteredTraces.length === 0 ? (
          <div className="p-16 text-center">
            <Shield className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-bold text-white mb-1">No Trace Investigations Found</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto mb-6">
              Start a new blockchain trace or seed sample law-enforcement test scenarios.
            </p>
            <div className="flex justify-center space-x-3">
              <button
                onClick={handleSeedDemoData}
                disabled={seeding}
                className="py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-400 text-xs font-bold border border-cyan-800/50 flex items-center space-x-1.5 transition"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Seed 3 Demo Scenarios</span>
              </button>
              <Link
                href="/"
                className="py-2.5 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition"
              >
                Launch Trace
              </Link>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 bg-[#0a0f1d]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Case / Trace ID</th>
                  <th className="py-3.5 px-5">Victim Address</th>
                  <th className="py-3.5 px-5 text-center">Hops</th>
                  <th className="py-3.5 px-5">Attribution (VASP)</th>
                  <th className="py-3.5 px-5">Risk Rating</th>
                  <th className="py-3.5 px-5">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-xs">
                {filteredTraces.map((trace) => (
                  <tr key={trace.id} className="hover:bg-slate-800/40 transition group">
                    <td className="py-4 px-5">
                      <div className="font-mono font-bold text-slate-200">{trace.complaint_id || 'NCRP-CASE'}</div>
                      <div className="text-[10px] text-slate-500 font-mono">#{trace.id.substring(0, 8)}</div>
                    </td>
                    <td className="py-4 px-5">
                      <span className="font-mono text-cyan-300 font-medium">
                        {trace.source_wallet ? `${trace.source_wallet.substring(0, 8)}...${trace.source_wallet.substring(36)}` : '-'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center font-mono font-bold text-slate-200">
                      {trace.hops_count || 0}
                    </td>
                    <td className="py-4 px-5">
                      {trace.target_vasp && trace.target_vasp !== '-' ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 font-medium text-[11px]">
                          {trace.target_vasp}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[11px]">Pending Detection</span>
                      )}
                    </td>
                    <td className="py-4 px-5">
                      <RiskBadge score={trace.risk_score || 0.0} size="sm" />
                    </td>
                    <td className="py-4 px-5">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          trace.status === 'completed'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50'
                            : 'bg-amber-950 text-amber-400 border border-amber-800/50 animate-pulse'
                        }`}
                      >
                        {trace.status}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <Link
                        href={`/trace/${trace.id}`}
                        className="inline-flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600 text-slate-200 hover:text-white transition font-medium text-xs group-hover:border-cyan-500/50"
                      >
                        <span>Inspect</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
