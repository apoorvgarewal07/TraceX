import React, { useState } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  Copy,
  Check,
  ExternalLink,
  Percent,
} from 'lucide-react';
import { ExitDetail, VaspTier } from '../api/client';
import { CitationChip } from './CitationChip';

interface ExitCardProps {
  key?: React.Key;
  exit: ExitDetail;
  onHighlightWallet?: (wallet: string) => void;
  onHighlightEdges?: (edgeIds: string[]) => void;
  onOpenNotice?: (vaspName: string, wallet: string) => void;
  className?: string;
}

export function ExitCard({
  exit,
  onHighlightWallet,
  onHighlightEdges,
  onOpenNotice,
  className = '',
}: ExitCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(exit.wallet);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const getTierConfig = (tier: VaspTier) => {
    switch (tier) {
      case 'Tier A':
        return {
          label: 'Tier A — Cooperative / FIU Registered',
          desc: 'Designated nodal officer available • Fast freeze response (< 2h) • Section 91 CrPC compliant',
          badgeClass: 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300 ring-1 ring-emerald-500/20',
          icon: <ShieldCheck className="h-4 w-4 text-emerald-400" />,
          accentBorder: 'border-l-emerald-500',
        };
      case 'Tier B':
        return {
          label: 'Tier B — Offshore / MLAT Required',
          desc: 'Foreign jurisdiction • Requires formal MLAT / Letter Rogatory or mutual legal assistance',
          badgeClass: 'bg-amber-950/60 border-amber-500/50 text-amber-300 ring-1 ring-amber-500/20',
          icon: <AlertTriangle className="h-4 w-4 text-amber-400" />,
          accentBorder: 'border-l-amber-500',
        };
      case 'Tier C':
      default:
        return {
          label: 'Tier C — High Risk / DeFi Mixer / Uncooperative',
          desc: 'Non-custodial smart contract or uncooperative off-ramp • Judicial escalation required',
          badgeClass: 'bg-rose-950/60 border-rose-500/50 text-rose-300 ring-1 ring-rose-500/20',
          icon: <ShieldAlert className="h-4 w-4 text-rose-400" />,
          accentBorder: 'border-l-rose-500',
        };
    }
  };

  const tierCfg = getTierConfig(exit.tier);
  const confidencePercent = Math.round(exit.confidence * 100);

  return (
    <div
      className={`p-4 rounded-xl bg-[#1A181D] border border-[#2E2B32] border-l-4 ${tierCfg.accentBorder} space-y-3 transition-all hover:border-[#3D3942] ${className}`}
    >
      {/* Top Header: VASP Name & Tier Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#242227] border border-[#2E2B32] text-[#B8935F]">
            <Building2 className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-[#EDE8DE] font-mono tracking-wide">{exit.vasp_name}</h4>
            <p className="text-[10px] text-[#7E7972] font-mono">Exit ID: {exit.exit_id}</p>
          </div>
        </div>

        {/* Distinct Tier Badge */}
        <div className={`px-2.5 py-1 rounded-full border text-[11px] font-medium flex items-center gap-1.5 self-start sm:self-auto ${tierCfg.badgeClass}`}>
          {tierCfg.icon}
          <span>{exit.tier}</span>
        </div>
      </div>

      <p className="text-[11px] text-[#A8A399] leading-relaxed">{tierCfg.desc}</p>

      {/* Target Deposit Wallet */}
      <div className="p-2.5 rounded-lg bg-[#141215] border border-[#26242A] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 overflow-hidden">
          <span className="text-[10px] font-mono uppercase text-[#7E7972] flex-shrink-0">Deposit Wallet:</span>
          <button
            type="button"
            onClick={() => onHighlightWallet?.(exit.wallet)}
            title="Click to highlight wallet in attribution graph"
            className="font-mono text-[#EDE8DE] hover:text-[#B8935F] truncate text-left transition-colors cursor-pointer"
          >
            {exit.wallet}
          </button>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          title="Copy wallet address"
          className="p-1 rounded text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors flex-shrink-0"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
        </button>
      </div>

      {/* Confidence Metric & Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 border-t border-[#26242A]">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs font-mono">
            <Percent className="h-3.5 w-3.5 text-[#B8935F]" />
            <span className="text-[#7E7972]">Attribution Confidence:</span>
            <span className="font-semibold text-[#EDE8DE]">{confidencePercent}%</span>
          </div>

          <div className="w-20 bg-[#242227] h-1.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                confidencePercent >= 90 ? 'bg-[#34D399]' : confidencePercent >= 75 ? 'bg-[#FBBF24]' : 'bg-[#F87171]'
              }`}
              style={{ width: `${confidencePercent}%` }}
            />
          </div>
        </div>

        {onOpenNotice && exit.tier !== 'Tier C' && (
          <button
            type="button"
            onClick={() => onOpenNotice(exit.vasp_name, exit.wallet)}
            className="px-2.5 py-1 rounded bg-[#B8935F]/15 border border-[#B8935F]/40 text-[#B8935F] hover:bg-[#B8935F]/25 text-[11px] font-medium flex items-center gap-1 transition-colors self-end sm:self-auto cursor-pointer"
          >
            <span>Draft Freeze Notice</span>
            <ExternalLink className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Linked Cryptographic Evidence IDs */}
      {exit.evidence_ids && exit.evidence_ids.length > 0 && (
        <div className="pt-2 border-t border-[#26242A]">
          <span className="text-[10px] font-mono text-[#7E7972] block mb-1">Chain of Custody Evidence:</span>
          <div className="flex flex-wrap gap-1.5">
            {exit.evidence_ids.map((evId, idx) => (
              <CitationChip
                key={idx}
                citation={`evidence:${evId}`}
                onSelect={(_type, id) => onHighlightEdges?.([id])}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
