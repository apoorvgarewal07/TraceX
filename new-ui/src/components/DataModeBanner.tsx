import React from 'react';
import { DataMode } from '../api/client';
import { ShieldCheck, Database, AlertOctagon, Radio } from 'lucide-react';

interface DataModeBannerProps {
  dataMode?: DataMode | string;
  reason?: string;
  className?: string;
}

export function DataModeBanner({ dataMode = 'LIVE', reason, className = '' }: DataModeBannerProps) {
  const mode = (dataMode || 'LIVE').toUpperCase();

  if (mode === 'LIVE') {
    return (
      <div
        className={`w-full px-4 py-2.5 bg-gradient-to-r from-[#172520] via-[#1A2E26] to-[#172520] border-y border-[#3B6B54]/40 text-[#EDE8DE] flex items-center justify-between text-xs select-none shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-[#34D399] opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#34D399]" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-bold text-[#34D399] tracking-wider uppercase">
              LIVE ON-CHAIN STREAM
            </span>
            <span className="text-[#A8A399] hidden sm:inline">
              Verified RPC execution active. Trace reflects live ledger state.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#34D399] font-mono bg-[#112019] px-2 py-0.5 rounded border border-[#3B6B54]/30">
          <ShieldCheck className="h-3 w-3" />
          <span>REAL-TIME</span>
        </div>
      </div>
    );
  }

  if (mode === 'CACHED' || mode === 'FIXTURE') {
    return (
      <div
        className={`w-full px-4 py-2.5 bg-gradient-to-r from-[#2B2317] via-[#332A1C] to-[#2B2317] border-y border-[#B8935F]/40 text-[#EDE8DE] flex items-center justify-between text-xs select-none shadow-sm ${className}`}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-center gap-2.5">
          <Database className="h-4 w-4 text-[#CFAC78] flex-shrink-0" />
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-[11px] font-bold text-[#CFAC78] tracking-wider uppercase">
              {mode === 'FIXTURE' ? 'BENCHMARK FIXTURE DATA' : 'CACHED FORENSIC SNAPSHOT'}
            </span>
            <span className="text-[#A8A399] hidden sm:inline">
              {reason || 'Synchronized local dataset. Real-time WebSocket streaming inactive.'}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-[11px] text-[#CFAC78] font-mono bg-[#1E1911] px-2 py-0.5 rounded border border-[#B8935F]/30">
          <Radio className="h-3 w-3 opacity-60" />
          <span>{mode === 'FIXTURE' ? 'FIXTURE' : 'CACHED'}</span>
        </div>
      </div>
    );
  }

  // UNAVAILABLE mode — honest warning
  return (
    <div
      className={`w-full px-4 py-3 bg-gradient-to-r from-[#381616] via-[#4A1D1D] to-[#381616] border-y border-[#E05A47]/60 text-[#EDE8DE] flex items-center justify-between text-xs select-none shadow-md ${className}`}
      role="alert"
    >
      <div className="flex items-center gap-3">
        <AlertOctagon className="h-5 w-5 text-[#F87171] flex-shrink-0" />
        <div>
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-xs font-bold text-[#F87171] tracking-wider uppercase">
              FORENSIC NODE UNAVAILABLE
            </span>
          </div>
          <p className="text-[11px] text-[#EDE8DE]/90 mt-0.5">
            {reason ||
              'RPC connection unreachable or node rate-limited. Live on-chain traversal offline. Presenting verified historical dossier honestly.'}
          </p>
        </div>
      </div>
      <span className="font-mono text-[11px] text-[#F87171] font-semibold bg-[#261010] px-2.5 py-1 rounded border border-[#E05A47]/40 whitespace-nowrap">
        OFFLINE HONESTY
      </span>
    </div>
  );
}
