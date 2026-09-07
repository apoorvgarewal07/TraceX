import React from 'react';
import Link from 'next/link';
import { Shield, Zap, Target, FileCheck, Layers, Cpu, ArrowRight, CheckCircle2 } from 'lucide-react';
import { TraceForm } from '@/components/TraceForm';

export default function Home() {
  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-64px)] pb-16">
      {/* Background Decorative Gradients */}
      <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[350px] bg-gradient-to-tr from-cyan-600/15 via-blue-600/10 to-indigo-600/15 blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">
        {/* Top Announcement Tag */}
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 text-xs font-semibold backdrop-blur-md shadow-lg shadow-cyan-950/50">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
            </span>
            <span>National Cyber Forensic Initiative • Indian Cyber Crime Coordination Centre (I4C)</span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="text-center max-w-4xl mx-auto mb-10">
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight leading-tight mb-4">
            Autonomous Multi-Hop <span className="bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">Crypto Forensics</span> & Exchange Attribution
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Trace stolen virtual digital assets across complex peeling chains and privacy mixers. Pinpoint centralized exchange deposit hubs and automatically issue statutory Section 91 CrPC asset freeze notices.
          </p>
        </div>

        {/* Trace Launcher Form */}
        <div className="max-w-3xl mx-auto mb-16">
          <TraceForm />
        </div>

        {/* Key Forensic Pillars */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-cyan-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-cyan-950/80 border border-cyan-800/80 flex items-center justify-center text-cyan-400 mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Sub-30s BFS Multi-Hop Traversal</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              High-throughput graph BFS traversing up to 100 transaction hops across EVM blockchains in under 30 seconds with automated loop suppression.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-indigo-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-indigo-950/80 border border-indigo-800/80 flex items-center justify-center text-indigo-400 mb-4 group-hover:scale-110 transition-transform">
              <Cpu className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Isolation Forest & ML Clustering</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Machine learning anomaly scoring classifies rapid transit mule wallets, mixer obfuscation routes, and sybil fund aggregation hubs.
            </p>
          </div>

          <div className="glass-card p-6 rounded-2xl border border-slate-800 hover:border-emerald-500/40 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-950/80 border border-emerald-800/80 flex items-center justify-center text-emerald-400 mb-4 group-hover:scale-110 transition-transform">
              <FileCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Statutory PDF Freeze Notices</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              1-click generation of court-admissible freeze directives under the IT Act 2000 & Section 91 CrPC ready for serving to Binance, CoinDCX, WazirX, and Kraken.
            </p>
          </div>
        </div>

        {/* Live Performance Benchmarks Banner */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-cyan-400">Validated Hackathon Metrics</span>
            <h4 className="text-lg font-bold text-white">Forensic Engine Performance Benchmarks</h4>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            <div className="px-3">
              <div className="text-xl font-mono font-extrabold text-cyan-400">&lt; 8.5s</div>
              <div className="text-[11px] text-slate-400">10-Hop Latency</div>
            </div>
            <div className="px-3">
              <div className="text-xl font-mono font-extrabold text-emerald-400">&gt; 92%</div>
              <div className="text-[11px] text-slate-400">VASP Attribution</div>
            </div>
            <div className="px-3">
              <div className="text-xl font-mono font-extrabold text-indigo-400">&lt; 3.2s</div>
              <div className="text-[11px] text-slate-400">PDF Generation</div>
            </div>
            <div className="px-3">
              <div className="text-xl font-mono font-extrabold text-amber-400">500+</div>
              <div className="text-[11px] text-slate-400">Indexed Exchanges</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
