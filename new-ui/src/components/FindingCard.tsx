import React from 'react';
import { Finding, FindingSeverity } from '../api/client';
import { ShieldAlert, AlertTriangle, Info, Eye, EyeOff, Hash, Layers } from 'lucide-react';

interface FindingCardProps {
  key?: string;
  finding: Finding;
  isHighlighted: boolean;
  onToggleHighlight: () => void;
}

const RULE_TITLES: Record<string, string> = {
  R1: 'R1 • Rapid Pass-Through',
  R1_RAPID_PASS_THROUGH: 'R1 • Rapid Pass-Through',
  R2: 'R2 • Peel Chain Pattern',
  R2_PEEL_CHAIN: 'R2 • Peel Chain Pattern',
  R3: 'R3 • Fan-Out Dispersion',
  R3_FAN_OUT: 'R3 • Fan-Out Dispersion',
  R4: 'R4 • Fan-In Consolidation',
  R4_FAN_IN: 'R4 • Fan-In Consolidation',
  R5: 'R5 • Privacy Protocol / Mixer',
  R5_PRIVACY_PROTOCOL: 'R5 • Privacy Protocol / Mixer',
  R6: 'R6 • Gas Sponsor Linkage',
  R6_GAS_SPONSOR_MATCH: 'R6 • Gas Sponsor Linkage',
  R7: 'R7 • Bytecode Similarity Match',
  R7_BYTECODE_MATCH: 'R7 • Bytecode Similarity Match',
  R8: 'R8 • Regulated Exchange Exit',
  R8_EXCHANGE_EXIT: 'R8 • Regulated Exchange Exit',
};

function formatRuleName(rule: string): string {
  if (RULE_TITLES[rule]) return RULE_TITLES[rule];
  const prefix = rule.split('_')[0];
  if (RULE_TITLES[prefix]) return RULE_TITLES[prefix];
  return rule.replace(/_/g, ' ');
}

function getSeverityBadge(severity: FindingSeverity) {
  switch (severity) {
    case 'high':
      return {
        label: 'HIGH SEVERITY',
        bg: 'bg-[#8C3B3B]/15',
        border: 'border-[#8C3B3B]/50',
        text: 'text-[#E05A47]',
        dot: 'bg-[#E05A47]',
        icon: ShieldAlert,
      };
    case 'medium':
      return {
        label: 'MEDIUM RISK',
        bg: 'bg-[#B8935F]/15',
        border: 'border-[#B8935F]/50',
        text: 'text-[#CFAC78]',
        dot: 'bg-[#B8935F]',
        icon: AlertTriangle,
      };
    case 'low':
    default:
      return {
        label: 'INFORMATIONAL',
        bg: 'bg-[#3B6B54]/15',
        border: 'border-[#3B6B54]/50',
        text: 'text-[#34D399]',
        dot: 'bg-[#3B6B54]',
        icon: Info,
      };
  }
}

export function FindingCard({ finding, isHighlighted, onToggleHighlight }: FindingCardProps) {
  const sev = getSeverityBadge(finding.severity);
  const SevIcon = sev.icon;
  const ruleDisplay = formatRuleName(finding.rule);
  const edgeCount = finding.evidence_edge_ids?.length || 0;

  return (
    <div
      className={`rounded-lg border transition-all duration-200 p-4 ${
        isHighlighted
          ? 'bg-[#201D22] border-[#B8935F] shadow-[0_0_12px_rgba(184,147,95,0.25)]'
          : 'bg-[#18161A] border-[#2A272D] hover:border-[#3D3942]'
      }`}
    >
      {/* Header: Rule Code & Severity Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-semibold text-[#EDE8DE] truncate">
            {ruleDisplay}
          </span>
        </div>
        <span
          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${sev.bg} ${sev.border} ${sev.text} whitespace-nowrap`}
        >
          <span className={`h-1.5 w-1.5 rounded-full ${sev.dot}`} />
          {sev.label}
        </span>
      </div>

      {/* Dynamic F-string Explanation */}
      <p className="text-xs text-[#A8A399] leading-relaxed mb-3">
        {finding.explanation}
      </p>

      {/* Evidence & Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-[#242227] text-[11px]">
        {/* Evidence Edge Pill */}
        <div className="flex items-center gap-1.5 text-[#7E7972]">
          <Layers className="h-3.5 w-3.5 text-[#B8935F]" />
          <span>
            {edgeCount} {edgeCount === 1 ? 'edge' : 'edges'} cited
          </span>
          {edgeCount > 0 && (
            <span className="font-mono text-[10px] text-[#A8A399] bg-[#121114] px-1.5 py-0.5 rounded border border-[#242227]">
              {finding.evidence_edge_ids.join(', ')}
            </span>
          )}
        </div>

        {/* Highlight in Graph Button */}
        {edgeCount > 0 && (
          <button
            type="button"
            onClick={onToggleHighlight}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors ${
              isHighlighted
                ? 'bg-[#B8935F] text-[#131114] font-semibold hover:bg-[#CFAC78]'
                : 'bg-[#242227] text-[#EDE8DE] hover:bg-[#2F2C33] border border-[#2E2B32]'
            }`}
          >
            {isHighlighted ? (
              <>
                <EyeOff className="h-3.5 w-3.5" />
                <span>Clear Highlight</span>
              </>
            ) : (
              <>
                <Eye className="h-3.5 w-3.5 text-[#B8935F]" />
                <span>Highlight in Graph</span>
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
