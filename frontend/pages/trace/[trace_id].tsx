import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import toast from 'react-hot-toast';
import {
  ShieldAlert,
  ArrowLeft,
  FileText,
  Copy,
  Layers,
  Activity,
  ExternalLink,
  CheckCircle2,
  AlertOctagon,
  RefreshCw,
  Cpu,
  Building2,
} from 'lucide-react';
import Link from 'next/link';

import { CytoscapeGraph, GraphData } from '@/components/CytoscapeGraph';
import { RiskBadge } from '@/components/RiskBadge';
import { FreezeNoticeModal } from '@/components/FreezeNoticeModal';
import { useWebSocket } from '@/hooks/useWebSocket';

export default function TraceDetail() {
  const router = useRouter();
  const { trace_id } = router.query;
  const traceIdStr = Array.isArray(trace_id) ? trace_id[0] : trace_id;

  const [trace, setTrace] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [isFreezeModalOpen, setIsFreezeModalOpen] = useState(false);
  const [clusteringResult, setClusteringResult] = useState<any>(null);
  const [clusteringLoading, setClusteringLoading] = useState(false);

  // Real-time WebSocket hook
  const { status: wsStatus, hops: wsHops, progress: wsProgress } = useWebSocket(traceIdStr);

  const fetchTrace = async () => {
    if (!traceIdStr) return;
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await axios.get(`${apiUrl}/api/v1/trace/${traceIdStr}`);
      setTrace(res.data);
    } catch (err) {
      console.error('Failed to load trace:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!traceIdStr) return;
    fetchTrace();
    // Poll every 3 seconds if processing
    const interval = setInterval(() => {
      if (trace?.status === 'processing' || !trace) {
        fetchTrace();
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [traceIdStr, trace?.status]);

  const handleNodeClick = (nodeId: string, nodeData: any) => {
    setSelectedNode(nodeData);
  };

  const handleRunClustering = async () => {
    if (!traceIdStr) return;
    setClusteringLoading(true);
    const toastId = toast.loading('Executing K-Means behavioral clustering on wallet network...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const res = await axios.post(`${apiUrl}/api/v1/cluster/${traceIdStr}`);
      setClusteringResult(res.data?.clustering);
      toast.success('Clustering completed!', { id: toastId });
    } catch (err) {
      toast.error('Clustering failed', { id: toastId });
    } finally {
      setClusteringLoading(false);
    }
  };

  const handleCopyReport = () => {
    if (!trace) return;
    const reportText = `=====================================================
CYBER CRIME FORENSIC ATTRIBUTION REPORT (I4C / MHA)
=====================================================
Case ID: ${trace.complaint_id || 'NCRP-UNKNOWN'}
Trace Reference: ${trace.id}
Source Victim Wallet: ${trace.source_wallet}
Total Hops Analyzed: ${trace.hops_count}
Identified Cashout VASP: ${trace.target_vasp || 'None'}
Aggregate Risk Anomaly Score: ${(trace.risk_score * 100).toFixed(1)}%
Generated At: ${new Date().toISOString()}

FLAGGED VASP EXCHANGES:
${(trace.identified_exchanges || [])
  .map((ex: any) => `- ${ex.name} (${ex.address}) [Confidence: ${Math.round(ex.confidence * 100)}%]`)
  .join('\n') || 'None'}

TRANSACTION HOPS:
${(trace.hops || [])
  .slice(0, 15)
  .map(
    (h: any) =>
      `Hop ${h.hop_number}: ${h.from} -> ${h.to} [${h.value} ${h.asset || 'ETH'}] (Tx: ${h.tx_hash})`
  )
  .join('\n')}
=====================================================`;
    navigator.clipboard.writeText(reportText);
    toast.success('Forensic Case Report copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-10 h-10 text-cyan-400 animate-spin mx-auto mb-3" />
          <h2 className="text-lg font-bold text-white">Synthesizing Forensic Case File...</h2>
          <p className="text-xs text-slate-400">Querying PostgreSQL, Neo4j Graph, and Redis cache</p>
        </div>
      </div>
    );
  }

  if (!trace) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <AlertOctagon className="w-12 h-12 text-rose-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-white mb-2">Trace Case Not Found</h2>
        <p className="text-xs text-slate-400 mb-6">The requested trace ID ({traceIdStr}) does not exist.</p>
        <Link href="/" className="px-4 py-2 rounded-xl bg-cyan-600 text-white font-bold text-xs">
          Return to Investigation Launcher
        </Link>
      </div>
    );
  }

  const graphData: GraphData = trace.graph || { nodes: [], edges: [] };
  const hopsList = trace.hops || [];
  const identifiedExchanges = trace.identified_exchanges || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Breadcrumb & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <Link
            href="/dashboard"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-xl sm:text-2xl font-black text-white">
                Case {trace.complaint_id || 'Forensic Investigation'}
              </h1>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                  trace.status === 'completed'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                    : 'bg-amber-950 text-amber-400 border border-amber-800/60 animate-pulse'
                }`}
              >
                {trace.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">Trace Ref: {trace.id}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={handleRunClustering}
            disabled={clusteringLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 text-xs font-bold border border-indigo-800/60 flex items-center space-x-1.5 transition"
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>ML Clustering</span>
          </button>

          <button
            onClick={handleCopyReport}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold border border-slate-700 flex items-center space-x-1.5 transition"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Copy Report</span>
          </button>

          <button
            onClick={() => setIsFreezeModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-extrabold text-xs shadow-lg shadow-rose-600/25 flex items-center space-x-1.5 transition transform active:scale-95"
          >
            <FileText className="w-4 h-4" />
            <span>STATUTORY FREEZE NOTICE (PDF)</span>
          </button>
        </div>
      </div>

      {/* Real-time Progress Bar (if active) */}
      {trace.status === 'processing' && (
        <div className="glass-panel p-4 rounded-2xl border border-amber-800/60 bg-amber-950/20">
          <div className="flex justify-between items-center text-xs font-semibold mb-2">
            <span className="text-amber-300 flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span>Multi-Hop Traversal in Progress...</span>
            </span>
            <span className="text-amber-400 font-mono">{wsProgress || 45}% complete</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-amber-500 transition-all duration-300"
              style={{ width: `${wsProgress || 45}%` }}
            />
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Victim / Source Wallet</span>
          <p className="font-mono text-xs text-cyan-300 font-bold truncate">{trace.source_wallet}</p>
          <div className="mt-2 text-[10px] text-slate-500 flex items-center space-x-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Verified Origin Point</span>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Total Hops Traversed</span>
          <p className="text-2xl font-black text-white font-mono">{trace.hops_count}</p>
          <div className="mt-1 text-[10px] text-slate-500">Max Depth: 100 hops</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">ML Risk Anomaly Score</span>
          <div className="flex items-center space-x-2">
            <p className="text-2xl font-black text-white font-mono">{Math.round(trace.risk_score * 100)}%</p>
            <RiskBadge score={trace.risk_score} size="sm" showIcon={false} />
          </div>
          <div className="mt-1 text-[10px] text-slate-500">Isolation Forest Scored</div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800">
          <span className="text-xs text-slate-400 block mb-1">Identified Cashout VASP</span>
          {trace.target_vasp && trace.target_vasp !== '-' ? (
            <p className="text-lg font-black text-emerald-400 flex items-center space-x-1.5 truncate">
              <Building2 className="w-4 h-4 flex-shrink-0" />
              <span>{trace.target_vasp}</span>
            </p>
          ) : (
            <p className="text-sm font-semibold text-slate-500">Pending Identification</p>
          )}
          <div className="mt-1 text-[10px] text-slate-500">Exchange Deposit Vault</div>
        </div>
      </div>

      {/* Main Forensic Canvas (Cytoscape Graph + Sidebar Inspector) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>Interactive Multi-Hop Fund Flow Graph</span>
            </h2>
            <span className="text-xs text-slate-400 font-mono">
              {graphData.nodes.length} Nodes • {graphData.edges.length} Transfers
            </span>
          </div>

          <CytoscapeGraph
            data={graphData}
            onNodeClick={handleNodeClick}
            height="560px"
          />
        </div>

        {/* Right Inspector Drawer */}
        <div className="space-y-4">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            <span>Selected Wallet Inspector</span>
          </h2>

          <div className="glass-panel p-5 rounded-2xl border border-slate-800 h-[560px] overflow-y-auto flex flex-col justify-between">
            {selectedNode ? (
              <div className="space-y-4 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                    Inspected Node Address
                  </span>
                  <p className="font-mono text-cyan-300 font-bold break-all">{selectedNode.id || selectedNode.address}</p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Entity Classification</span>
                    <span className="font-bold text-white uppercase">{selectedNode.type || 'Mule'}</span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                    <span className="text-[10px] text-slate-500 block">Risk Anomaly</span>
                    <span className="font-bold text-rose-400">{Math.round((selectedNode.riskScore || 0.5) * 100)}%</span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                    Forensic Action Directive
                  </span>
                  {selectedNode.type === 'exchange' ? (
                    <p className="text-emerald-400 leading-relaxed font-medium">
                      🎯 Centralized Exchange Endpoint. Immediately serve Section 91 CrPC notice for KYC & account freeze.
                    </p>
                  ) : selectedNode.type === 'mixer' ? (
                    <p className="text-amber-400 leading-relaxed font-medium">
                      ⚠️ Privacy Mixer / Obfuscation Router. Check relayer fee addresses and exit transactions.
                    </p>
                  ) : selectedNode.type === 'victim' ? (
                    <p className="text-rose-400 leading-relaxed font-medium">
                      🛡️ Complainant's source wallet. Verify initial transaction signature and private key compromise.
                    </p>
                  ) : (
                    <p className="text-slate-300 leading-relaxed">
                      Intermediate transit mule node. Part of automated fund dispersion chain.
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    onClick={() => setIsFreezeModalOpen(true)}
                    className="w-full py-2.5 rounded-xl bg-rose-950 hover:bg-rose-900 text-rose-400 border border-rose-800 font-bold transition"
                  >
                    Target in Freeze Notice
                  </button>
                </div>
              </div>
            ) : (
              <div className="text-center my-auto p-6">
                <Activity className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 font-medium text-xs">Tap any node on the graph canvas to inspect full forensic telemetry.</p>
              </div>
            )}

            {/* Identified Exchanges Summary List */}
            {identifiedExchanges.length > 0 && (
              <div className="mt-4 pt-4 border-t border-slate-800">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">
                  Identified VASPs ({identifiedExchanges.length})
                </span>
                <div className="space-y-1.5">
                  {identifiedExchanges.map((ex: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-[11px]"
                    >
                      <span className="font-bold text-emerald-400">{ex.name}</span>
                      <span className="font-mono text-slate-400">{Math.round(ex.confidence * 100)}% Conf.</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ML Clustering Panel (If computed) */}
      {clusteringResult && (
        <div className="glass-panel p-6 rounded-2xl border border-indigo-800/50 bg-indigo-950/15">
          <div className="flex items-center space-x-2 mb-4">
            <Cpu className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-bold text-white">Machine Learning Behavioral Clustering Analysis</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Object.entries(clusteringResult.summary || {}).map(([cid, data]: any) => (
              <div key={cid} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800">
                <div className="text-xs font-bold text-indigo-400 mb-1">Cluster #{cid}</div>
                <div className="text-sm font-semibold text-white mb-2">{data.description}</div>
                <div className="text-xs text-slate-400">{data.count} Wallets in Ring</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paginated Hops Table */}
      <div className="glass-panel rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center space-x-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Forensic Hop Ledger ({hopsList.length} Hops)</span>
          </h3>
          <span className="text-xs text-slate-400">Chronological Fund Trail</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-[#0a0f1d]/80 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                <th className="py-3 px-5 text-center">Hop #</th>
                <th className="py-3 px-5">From Address</th>
                <th className="py-3 px-5">To Address</th>
                <th className="py-3 px-5">Amount Transferred</th>
                <th className="py-3 px-5">Transaction Hash</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80">
              {hopsList.map((h: any, idx: number) => (
                <tr key={idx} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-5 text-center font-mono font-bold text-cyan-400">{h.hop_number}</td>
                  <td className="py-3 px-5 font-mono text-slate-300 truncate max-w-[180px]">{h.from}</td>
                  <td className="py-3 px-5 font-mono text-slate-300 truncate max-w-[180px]">{h.to}</td>
                  <td className="py-3 px-5 font-mono font-bold text-slate-100">
                    {h.value} {h.asset || 'ETH'}
                  </td>
                  <td className="py-3 px-5 font-mono text-slate-400 truncate max-w-[200px]">
                    <span className="text-cyan-400">{h.tx_hash}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Freeze Notice Modal */}
      <FreezeNoticeModal
        isOpen={isFreezeModalOpen}
        onClose={() => setIsFreezeModalOpen(false)}
        traceId={trace.id}
        defaultExchange={trace.target_vasp || 'Binance'}
        sourceWallet={trace.source_wallet}
        riskScore={trace.risk_score}
      />
    </div>
  );
}
