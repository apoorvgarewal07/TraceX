import React, { useState } from 'react';
import { ForensicCase } from '../types';
import { FORENSIC_CASES } from '../data/cases';
import { HeroEmblemNetwork } from './HeroEmblemNetwork';
import {
  Shield,
  Search,
  FolderOpen,
  ArrowRight,
  Play,
  AlertCircle,
  FileCheck,
  Building2,
  ExternalLink,
} from 'lucide-react';

interface HomeScreenProps {
  onExecuteTrace: (address: string, chain: string, complaintId?: string) => void;
  onSelectCase: (c: ForensicCase) => void;
  hasActiveSession?: boolean;
  activeCase?: ForensicCase;
  onReturnToDashboard?: () => void;
}

export function HomeScreen({
  onExecuteTrace,
  onSelectCase,
  hasActiveSession,
  activeCase,
  onReturnToDashboard,
}: HomeScreenProps) {
  const [address, setAddress] = useState('');
  const [selectedChain, setSelectedChain] = useState<'Ethereum (ETH)' | 'Polygon (POL)'>('Ethereum (ETH)');
  const [complaintId, setComplaintId] = useState('');
  const [selectedPresetId, setSelectedPresetId] = useState<string>(FORENSIC_CASES[0].id);
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleTraceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanAddr = address.trim();

    if (!cleanAddr) {
      setValidationError('Please enter a target suspect wallet address.');
      return;
    }

    if (!cleanAddr.startsWith('0x') || cleanAddr.length !== 42) {
      setValidationError('Enter a valid 42-character EVM hex address (e.g. 0x...).');
      return;
    }

    setValidationError(null);
    onExecuteTrace(cleanAddr, selectedChain, complaintId.trim() || undefined);
  };

  const handleLoadPreset = () => {
    const matchedCase = FORENSIC_CASES.find((c) => c.id === selectedPresetId);
    if (matchedCase) {
      onSelectCase(matchedCase);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#131114] text-[#EDE8DE] relative overflow-hidden select-none">
      {/* 1. Minimal Top Header */}
      <header className="border-b border-[#2A272D] bg-[#161418]/90 backdrop-blur-sm px-6 py-3.5 z-20">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-9 w-9 items-center justify-center rounded border border-[#B8935F]/40 bg-[#1C1A1E] text-[#B8935F] shadow-sm">
              <Shield className="h-5 w-5" strokeWidth={1.8} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg tracking-tight font-semibold text-[#EDE8DE]">
                  TraceX
                </span>
                <span className="text-[11px] font-normal text-[#A8A399] border-l border-[#2E2B32] pl-2">
                  I4C Cyber Forensics Desk
                </span>
              </div>
              <p className="text-[11px] text-[#7E7972] leading-none">
                Ministry of Home Affairs • Government of India
              </p>
            </div>
          </div>

          {/* Right Action: Return to active session if mid-session */}
          {hasActiveSession && onReturnToDashboard && activeCase && (
            <button
              onClick={onReturnToDashboard}
              className="flex items-center gap-2 px-3.5 py-1.5 rounded border border-[#B8935F]/40 bg-[#1C1A1E] hover:bg-[#252228] text-xs font-medium text-[#B8935F] transition-all shadow-sm"
              title="Return to currently loaded investigation"
            >
              <span>Return to Case ({activeCase.ncrpDocketNumber})</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </header>

      {/* 2. Hero Stage with Ashoka Emblem Node-Network Background */}
      <main className="flex-1 flex items-center justify-center px-6 py-12 relative z-10">
        {/* Ashoka Emblem Decorative Constellation Background */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
          <HeroEmblemNetwork className="w-full max-w-[460px] md:max-w-[500px] lg:max-w-[540px] opacity-40 md:opacity-50 lg:opacity-75 translate-y-2 lg:translate-x-32" />
        </div>

        {/* Foreground Content Card Container */}
        <div className="w-full max-w-2xl relative z-10 space-y-8">
          {/* Editorial Title & Overview */}
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded bg-[#1C1A1E] border border-[#2E2B32] text-[11px] font-medium text-[#B8935F]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8935F] animate-pulse"></span>
              STATUTORY CYBER FORENSICS • SECTION 91 BNSS / CrPC DIRECTIVES
            </div>

            <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-normal text-[#EDE8DE] tracking-tight leading-tight">
              Forensic Fund-Flow Tracing
            </h1>

            <p className="text-xs sm:text-sm text-[#A8A399] max-w-xl mx-auto leading-relaxed">
              Trace on-chain cryptocurrency theft across Ethereum and Polygon networks. Identify transit mules, aggregate fan-out peeling clusters, and attribute exit wallets to FIU-registered Indian exchanges with statutory preservation directives.
            </p>
          </div>

          {/* Central Search Input Box */}
          <div className="panel-dossier rounded-lg p-6 border border-[#B8935F]/20 shadow-2xl backdrop-blur-md bg-[#161418]/95 space-y-5">
            <form onSubmit={handleTraceSubmit} className="space-y-4">
              {/* Chain Selector Tabs */}
              <div>
                <label className="block text-[11px] text-[#A8A399] mb-1.5 uppercase font-medium tracking-wider">
                  Target Blockchain Network
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedChain('Ethereum (ETH)')}
                    className={`py-2 px-3 rounded text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                      selectedChain === 'Ethereum (ETH)'
                        ? 'bg-[#242227] text-[#EDE8DE] border-[#B8935F]'
                        : 'bg-[#18161A] text-[#7E7972] border-[#2A272D] hover:text-[#EDE8DE]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedChain === 'Ethereum (ETH)' ? 'bg-[#B8935F]' : 'bg-[#7E7972]'}`}></span>
                    Ethereum (ETH Mainnet)
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChain('Polygon (POL)')}
                    className={`py-2 px-3 rounded text-xs font-medium border transition-colors flex items-center justify-center gap-2 ${
                      selectedChain === 'Polygon (POL)'
                        ? 'bg-[#242227] text-[#EDE8DE] border-[#B8935F]'
                        : 'bg-[#18161A] text-[#7E7972] border-[#2A272D] hover:text-[#EDE8DE]'
                    }`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${selectedChain === 'Polygon (POL)' ? 'bg-[#B8935F]' : 'bg-[#7E7972]'}`}></span>
                    Polygon (POL / PoS)
                  </button>
                </div>
              </div>

              {/* Wallet Address Input */}
              <div>
                <label htmlFor="home-wallet-address" className="block text-xs font-medium text-[#EDE8DE] mb-1.5">
                  Suspect Wallet Address (0x...)
                </label>
                <div className="relative">
                  <input
                    id="home-wallet-address"
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      if (validationError) setValidationError(null);
                    }}
                    placeholder="0x71c... or enter target EVM wallet"
                    className="w-full rounded border border-[#2E2B32] bg-[#1C1A1E] px-3.5 py-2.5 text-xs text-[#EDE8DE] font-mono placeholder-[#7E7972] focus:border-[#B8935F] focus:outline-none transition-colors"
                  />
                  <Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#7E7972]" />
                </div>
                {validationError && (
                  <p className="mt-1 text-[11px] text-[#8C3B3B] flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validationError}
                  </p>
                )}
              </div>

              {/* FIR / Docket Reference (Optional) */}
              <div>
                <label htmlFor="home-complaint-id" className="block text-[11px] text-[#A8A399] mb-1.5">
                  Police FIR / NCRP Complaint Docket Number <span className="text-[#7E7972]">(Optional)</span>
                </label>
                <input
                  id="home-complaint-id"
                  type="text"
                  value={complaintId}
                  onChange={(e) => setComplaintId(e.target.value)}
                  placeholder="e.g. NCRP/2024/77812 or FIR 308/2024"
                  className="w-full rounded border border-[#2E2B32] bg-[#1C1A1E] px-3.5 py-2 text-xs text-[#EDE8DE] placeholder-[#7E7972] focus:border-[#B8935F] focus:outline-none transition-colors"
                />
              </div>

              {/* Run Trace CTA */}
              <button
                type="submit"
                className="w-full rounded bg-[#B8935F] py-3 px-4 text-xs font-semibold text-[#131114] hover:bg-[#CFAC78] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <Play className="h-4 w-4 fill-current" />
                <span>Run Forensic Trace & Generate Graph</span>
              </button>
            </form>

            {/* Benchmark Preset Selector Divider */}
            <div className="relative pt-4 pb-1 border-t border-[#242227]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] text-[#A8A399]">Or load an active benchmark police case:</span>
                <span className="text-[10px] text-[#B8935F] font-mono">FIU-IND Verified</span>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <select
                    value={selectedPresetId}
                    onChange={(e) => setSelectedPresetId(e.target.value)}
                    className="w-full appearance-none rounded border border-[#2E2B32] bg-[#1C1A1E] px-3 py-2 text-xs text-[#EDE8DE] focus:border-[#B8935F] focus:outline-none pr-8 cursor-pointer"
                  >
                    {FORENSIC_CASES.map((c) => (
                      <option key={c.id} value={c.id} className="bg-[#1C1A1E] text-[#EDE8DE]">
                        {c.ncrpDocketNumber} — {c.crimeCategory.slice(0, 34)}...
                      </option>
                    ))}
                  </select>
                  <FolderOpen className="pointer-events-none absolute right-2.5 top-2.5 h-3.5 w-3.5 text-[#B8935F]" />
                </div>
                <button
                  type="button"
                  onClick={handleLoadPreset}
                  className="px-3 py-2 rounded bg-[#242227] hover:bg-[#2F2B33] text-xs text-[#EDE8DE] border border-[#3A363E] font-medium transition-colors flex items-center gap-1.5"
                >
                  <span>Load Preset</span>
                  <ArrowRight className="h-3 w-3 text-[#B8935F]" />
                </button>
              </div>
            </div>
          </div>

          {/* Statutory badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-[11px] text-[#7E7972] pt-2">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5 text-[#B8935F]" />
              <span>Section 91 BNSS Directives</span>
            </div>
            <div className="flex items-center gap-1.5">
              <FileCheck className="h-3.5 w-3.5 text-[#3B6B54]" />
              <span>FIU-IND Registered VASPs</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Shield className="h-3.5 w-3.5 text-[#B8935F]" />
              <span>Law Enforcement Authenticated</span>
            </div>
          </div>
        </div>
      </main>

      {/* 3. Footer */}
      <footer className="border-t border-[#2A272D] bg-[#141215] px-6 py-3 text-center text-[11px] text-[#7E7972] z-20">
        Indian Cyber Crime Coordination Centre (I4C) • Ministry of Home Affairs • Digital Asset Forensic Intelligence
      </footer>
    </div>
  );
}
