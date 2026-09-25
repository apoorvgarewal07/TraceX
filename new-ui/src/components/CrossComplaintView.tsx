import React, { useState, useEffect } from 'react';
import {
  FileText,
  Percent,
  Copy,
  Check,
  Loader2,
  AlertCircle,
  ExternalLink,
  ShieldAlert,
  GitFork,
} from 'lucide-react';
import { CrossComplaintMatch, getCrossComplaintMatches } from '../api/client';

interface CrossComplaintViewProps {
  caseId: string;
  onSelectMatch?: (match: CrossComplaintMatch) => void;
  className?: string;
}

export function CrossComplaintView({
  caseId,
  onSelectMatch,
  className = '',
}: CrossComplaintViewProps) {
  const [matches, setMatches] = useState<CrossComplaintMatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchMatches() {
      try {
        setLoading(true);
        setError(null);
        const data = await getCrossComplaintMatches(caseId);
        if (mounted) setMatches(data);
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load cross-complaint matches');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchMatches();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  const handleCopy = (text: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    setTimeout(() => setCopiedId(null), 1500);
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#A8A399] flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
        <p className="text-xs">Correlating cross-jurisdictional police & NCRP database records...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg bg-[#8C3B3B]/15 border border-[#8C3B3B]/40 text-xs text-[#E05A47] flex items-center gap-2">
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  if (matches.length === 0) {
    return (
      <div className="p-8 text-center text-[#7E7972] border border-[#2A272D] rounded-xl bg-[#141215]">
        <FileText className="h-8 w-8 mx-auto text-[#7E7972] mb-2 opacity-50" />
        <p className="text-xs font-medium">No cross-complaint matches detected.</p>
        <p className="text-[11px] text-[#5A5650] mt-0.5">
          No other police stations or NCRP complaints have reported these addresses yet.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#2A272D]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#B8935F]/15 border border-[#B8935F]/30 text-[#B8935F]">
            <GitFork className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#EDE8DE] uppercase tracking-wider font-mono">
              Cross-Complaint Matches ({matches.length})
            </h3>
            <p className="text-[10px] text-[#7E7972]">
              Multi-FIR nexus: shared suspect addresses linking across state & national cybercrime dossiers
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {matches.map((match, idx) => {
          const confidencePercent = Math.round(match.confidence * 100);

          return (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#18161A] border border-[#2A272D] hover:border-[#3D3942] transition-colors space-y-3"
            >
              {/* Header: Case Ref & Portal */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="p-1 rounded bg-[#242227] border border-[#2E2B32] text-[#B8935F]">
                    <ShieldAlert className="h-3.5 w-3.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-[#EDE8DE] font-mono tracking-wide">
                      {match.matched_case_id}
                    </h4>
                    <p className="text-[10px] text-[#7E7972]">
                      Reported: {match.matched_date || 'Active Complaint'} • Status: {match.case_status || 'Under Investigation'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono border border-[#B8935F]/30 bg-[#B8935F]/15 text-[#B8935F]">
                    {match.matched_source || 'NCRP'}
                  </span>
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono bg-[#3B6B54]/20 border border-[#3B6B54]/40 text-[#34D399]">
                    <Percent className="h-2.5 w-2.5" />
                    <span>{confidencePercent}% Match</span>
                  </div>
                </div>
              </div>

              {/* Shared Node / Wallet */}
              <div className="p-2.5 rounded-lg bg-[#141215] border border-[#26242A] flex items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 overflow-hidden">
                  <span className="text-[10px] font-mono uppercase text-[#7E7972] flex-shrink-0">
                    Shared Suspect Nexus:
                  </span>
                  <span className="font-mono text-[#EDE8DE] truncate">{match.shared_wallet_or_parent}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => handleCopy(match.shared_wallet_or_parent, e)}
                  title="Copy shared address"
                  className="p-1 rounded text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors flex-shrink-0"
                >
                  {copiedId === match.shared_wallet_or_parent ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="h-3.5 w-3.5" />
                  )}
                </button>
              </div>

              {/* Confidence Meter & Linking */}
              <div className="flex items-center justify-between pt-1 border-t border-[#26242A]">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-[#7E7972]">Syndicate Correlation:</span>
                  <div className="w-24 bg-[#242227] h-1.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#34D399]"
                      style={{ width: `${confidencePercent}%` }}
                    />
                  </div>
                </div>

                {onSelectMatch && (
                  <button
                    type="button"
                    onClick={() => onSelectMatch(match)}
                    className="text-[11px] font-mono text-[#B8935F] hover:text-[#CFAC78] flex items-center gap-1 transition-colors cursor-pointer"
                  >
                    <span>View Dossier Correlation</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
