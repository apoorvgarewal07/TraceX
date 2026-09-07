import React, { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';
import toast from 'react-hot-toast';
import { Search, Sparkles, ShieldAlert, ArrowRight, Globe, Flame } from 'lucide-react';

interface TraceFormProps {
  onSuccess?: (traceId: string) => void;
}

export const TraceForm: React.FC<TraceFormProps> = ({ onSuccess }) => {
  const router = useRouter();
  const [wallet, setWallet] = useState('');
  const [txHashes, setTxHashes] = useState('');
  const [complaintId, setComplaintId] = useState('');
  const [chain, setChain] = useState<'ETH' | 'POLYGON'>('ETH');
  const [activeTab, setActiveTab] = useState<'real' | 'simulated'>('real');
  const [loading, setLoading] = useState(false);

  // Real famous on-chain Ethereum/Polygon hacks and exploiters
  const realCases = [
    {
      name: 'Euler Finance Exploiter',
      wallet: '0xebc29148c3363ba6738b576f571650c8223c30bc',
      tx: '0xc310a0affe2169d9f6feec1c638f2d72fbed4b975650ca8232ba4f6147bb1a41',
      caseId: 'I4C-ETH-EULER-200M',
      tag: 'Real Mainnet • $200M Theft',
    },
    {
      name: 'KyberSwap Exploiter',
      wallet: '0x50275e8d726a5c62d611b22e4527d0e157566cb2',
      tx: '0x4846879cbd0d1e39a0ff3e5caec2e07eb54f15d2fb321a6a5d4ae61c6b54a2ef',
      caseId: 'I4C-ETH-KYBER-48M',
      tag: 'Real Mainnet • $48M Exploit',
    },
    {
      name: 'Binance Hot Wallet (14)',
      wallet: '0x28c6c06298d514db089934071355e5743bf21d60',
      tx: '',
      caseId: 'I4C-REAL-BINANCE-14',
      tag: 'Real Mainnet • Central Hub',
    },
  ];

  const simulatedScenarios = [
    {
      name: '3-Hop Phishing (Direct Binance)',
      wallet: '0x3a9b1c8f4d7e2a5b6c0d8f1e3a5c7e9b2d4f6a81',
      tx: '0x3311aa22bb33cc44dd55ee66ff77aa88bb99cc00112233445566778899aabbcc',
      caseId: 'NCRP-2024-3HOP-004',
      tag: 'Exact 3 Hops • Cashout',
    },
    {
      name: 'Ponzi Scam (Binance Cashout)',
      wallet: '0x98f4a1c5123456789abcdef12345678901234567',
      tx: '0x4a8b9c1d2e3f4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b',
      caseId: 'NCRP-2024-PONZI-001',
      tag: '12 Hops • High Risk',
    },
    {
      name: 'Romance Scam (Mixer -> CoinDCX)',
      wallet: '0x55a1b2c3d4e5f60718293a4b5c6d7e8f90123456',
      tx: '0x8e7d6c5b4a3f2e1d0c9b8a7f6e5d4c3b2a1f0e9d8c7b6a5f4e3d2c1b0a9f8e7d',
      caseId: 'SAHYOG-2024-ROMANCE-002',
      tag: 'Mixer Obfuscation',
    },
  ];

  const handleSelectPreset = (preset: { name: string; wallet: string; tx: string; caseId: string }) => {
    setWallet(preset.wallet);
    setTxHashes(preset.tx);
    setComplaintId(preset.caseId);
    toast.success(`Loaded forensic target: ${preset.name}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanWallet = wallet.trim().toLowerCase();

    if (!cleanWallet.match(/^0x[a-f0-9]{40}$/i)) {
      toast.error('Invalid Ethereum/Polygon wallet address. Must start with 0x followed by 40 hex characters.');
      return;
    }

    setLoading(true);
    const toastId = toast.loading('Querying live blockchain RPC and traversing multi-hop graph...');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(`${apiUrl}/api/v1/trace`, {
        victim_wallet: cleanWallet,
        tx_hashes: txHashes
          ? txHashes.split(/[\n,]+/).map((h) => h.trim()).filter((h) => h.length > 0)
          : [],
        complaint_id: complaintId.trim() || `NCRP-${Date.now()}`,
        chain: chain,
        max_hops: 15,
        max_nodes: 5000,
        stop_at_vasp: true,
      });

      toast.success('Trace initiated! Opening interactive forensic canvas...', { id: toastId });
      const traceId = response.data.trace_id;

      if (onSuccess) {
        onSuccess(traceId);
      } else {
        router.push(`/trace/${traceId}`);
      }
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to start trace';
      toast.error(`Trace initiation failed: ${msg}`, { id: toastId });
    } finally {
      setLoading(false);
    }
  };

  const currentPresets = activeTab === 'real' ? realCases : simulatedScenarios;

  return (
    <div className="w-full glass-panel rounded-2xl p-6 sm:p-8 border border-slate-700/80 shadow-2xl relative overflow-hidden">
      {/* Glow accent */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Switcher */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => setActiveTab('real')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              activeTab === 'real'
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Real Mainnet Cases</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('simulated')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition ${
              activeTab === 'simulated'
                ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg shadow-cyan-950/50'
                : 'bg-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>Simulated Scenarios</span>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-[11px] text-slate-400">Target Chain:</span>
          <select
            value={chain}
            onChange={(e) => setChain(e.target.value as any)}
            className="px-2.5 py-1 bg-[#0a0f1d] border border-slate-700 rounded-lg text-xs font-mono text-cyan-300 focus:outline-none"
          >
            <option value="ETH">Ethereum (ETH)</option>
            <option value="POLYGON">Polygon (POL)</option>
          </select>
        </div>
      </div>

      {/* Preset Quick-Pickers */}
      <div className="mb-6">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2.5 flex items-center space-x-1.5">
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>Click to Auto-Fill Preset ({activeTab === 'real' ? 'Live On-Chain Data' : 'Simulated Test Case'})</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          {currentPresets.map((demo, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSelectPreset(demo)}
              className="text-left p-3 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-cyan-500/50 transition-all group"
            >
              <div className="text-xs font-bold text-white group-hover:text-cyan-400 transition-colors flex items-center justify-between">
                <span>{demo.name}</span>
                <ArrowRight className="w-3 h-3 text-slate-500 group-hover:text-cyan-400 transition" />
              </div>
              <div className="mt-1 flex items-center space-x-2">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                  activeTab === 'real'
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60'
                    : 'bg-cyan-950/80 text-cyan-400 border border-cyan-800/60'
                }`}>
                  {demo.tag}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Investigation Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center justify-between">
            <span className="flex items-center space-x-1.5">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
              <span>Target Wallet Address (Real or Simulated)</span>
            </span>
            <span className="text-[10px] text-slate-400">EVM Hex (0x...)</span>
          </label>
          <input
            type="text"
            value={wallet}
            onChange={(e) => setWallet(e.target.value)}
            placeholder="e.g. 0xebc29148c3363ba6738b576f571650c8223c30bc or paste any real wallet"
            className="w-full px-4 py-3 bg-[#0a0f1d] border border-slate-700 rounded-xl text-slate-100 font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              NCRP Case Ref / FIR Number
            </label>
            <input
              type="text"
              value={complaintId}
              onChange={(e) => setComplaintId(e.target.value)}
              placeholder="e.g. NCRP-2024-LIVE-001"
              className="w-full px-4 py-2.5 bg-[#0a0f1d] border border-slate-700 rounded-xl text-slate-100 font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Initial Fraud Transaction Hashes (Optional)
            </label>
            <input
              type="text"
              value={txHashes}
              onChange={(e) => setTxHashes(e.target.value)}
              placeholder="0xc310..., 0x4846..."
              className="w-full px-4 py-2.5 bg-[#0a0f1d] border border-slate-700 rounded-xl text-slate-100 font-mono text-xs placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 transition"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !wallet.trim()}
          className="w-full mt-2 py-3.5 px-6 rounded-xl bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-cyan-500/25 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              <span>Querying Live On-Chain Data & Multi-Hop BFS...</span>
            </>
          ) : (
            <>
              <Search className="w-4 h-4" />
              <span>EXECUTE LIVE ON-CHAIN FORENSIC TRACE</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};
