import React, { useState, useEffect } from 'react';
import {
  Flame,
  ArrowRight,
  Copy,
  Check,
  Sparkles,
  Loader2,
  AlertCircle,
  Network,
  Users,
} from 'lucide-react';
import { GasParentCluster, getGasParentClusters } from '../api/client';
import { CitationChip } from './CitationChip';

interface GasParentClusterViewProps {
  caseId: string;
  onHighlightWallets?: (wallets: string[]) => void;
  onHighlightEdges?: (edgeIds: string[]) => void;
  className?: string;
}

export function GasParentClusterView({
  caseId,
  onHighlightWallets,
  onHighlightEdges,
  className = '',
}: GasParentClusterViewProps) {
  const [clusters, setClusters] = useState<GasParentCluster[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    async function fetchClusters() {
      try {
        setLoading(true);
        setError(null);
        const data = await getGasParentClusters(caseId);
        if (mounted) {
          setClusters(data);
          if (data.length > 0) setActiveClusterId(data[0].cluster_id);
        }
      } catch (err: any) {
        if (mounted) setError(err?.message || 'Failed to load gas parent clusters');
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchClusters();
    return () => {
      mounted = false;
    };
  }, [caseId]);

  const handleCopy = (address: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => setCopiedAddress(null), 1500);
  };

  const handleHighlightCluster = (cluster: GasParentCluster) => {
    setActiveClusterId(cluster.cluster_id);
    if (onHighlightWallets) {
      onHighlightWallets([cluster.funding_wallet, ...cluster.funded_wallets]);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-[#A8A399] flex flex-col items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
        <p className="text-xs">Analyzing gas dispenser topologies & sponsor linkages...</p>
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

  if (clusters.length === 0) {
    return (
      <div className="p-8 text-center text-[#7E7972] border border-[#2A272D] rounded-xl bg-[#141215]">
        <Flame className="h-8 w-8 mx-auto text-[#7E7972] mb-2 opacity-50" />
        <p className="text-xs font-medium">No common gas sponsor clusters identified for this trace.</p>
        <p className="text-[11px] text-[#5A5650] mt-0.5">Wallets funded their own transaction gas independently.</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between pb-2 border-b border-[#2A272D]">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#B8935F]/15 border border-[#B8935F]/30 text-[#B8935F]">
            <Flame className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-semibold text-[#EDE8DE] uppercase tracking-wider font-mono">
              Gas-Parent Clusters ({clusters.length})
            </h3>
            <p className="text-[10px] text-[#7E7972]">
              Off-chain operational link: common parent address providing ETH gas to distinct syndicate wallets
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {clusters.map((cluster) => {
          const isActive = activeClusterId === cluster.cluster_id;

          return (
            <div
              key={cluster.cluster_id}
              className={`p-4 rounded-xl bg-[#18161A] border transition-all ${
                isActive
                  ? 'border-[#B8935F]/80 shadow-[0_0_15px_rgba(184,147,95,0.15)] ring-1 ring-[#B8935F]/40'
                  : 'border-[#2A272D] hover:border-[#3D3942]'
              }`}
            >
              {/* Cluster Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-semibold text-[#EDE8DE] bg-[#242227] px-2 py-0.5 rounded border border-[#2E2B32]">
                    {cluster.cluster_id}
                  </span>
                  <span className="text-[11px] text-[#B8935F] font-mono flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    <span>{cluster.funded_wallets.length} Funded Wallets</span>
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => handleHighlightCluster(cluster)}
                  className="px-2.5 py-1 rounded bg-[#B8935F]/15 hover:bg-[#B8935F]/25 border border-[#B8935F]/40 text-[#B8935F] text-[11px] font-mono flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
                >
                  <Network className="h-3 w-3" />
                  <span>Highlight Cluster in Graph</span>
                </button>
              </div>

              {/* Visual Grouping / Halo Container */}
              <div className="rounded-xl border border-[#3E3844] bg-[#141215]/80 p-3 space-y-3 shadow-inner">
                {/* Funding Sponsor (Gas Parent) */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 rounded-lg bg-[#241F1C] border border-[#B8935F]/30">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="px-1.5 py-0.5 rounded bg-[#B8935F]/20 text-[#B8935F] text-[10px] font-mono font-semibold uppercase flex-shrink-0 flex items-center gap-1">
                      <Sparkles className="h-2.5 w-2.5" />
                      Gas Sponsor:
                    </span>
                    <span className="font-mono text-xs text-[#EDE8DE] truncate font-medium">
                      {cluster.funding_wallet}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleCopy(cluster.funding_wallet, e)}
                    className="p-1 rounded text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#2A272D] transition-colors self-end sm:self-auto flex-shrink-0"
                    title="Copy address"
                  >
                    {copiedAddress === cluster.funding_wallet ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>

                {/* Arrow connector */}
                <div className="flex items-center justify-center -my-1 text-[#B8935F]/60">
                  <div className="h-2 border-l border-dashed border-[#B8935F]/40" />
                </div>

                {/* Funded Syndicate Wallets (Halo Group) */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-mono uppercase text-[#7E7972] tracking-wider block">
                    Funded Syndicate Nodes ({cluster.funded_wallets.length}):
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-1.5">
                    {cluster.funded_wallets.map((wallet, idx) => (
                      <div
                        key={idx}
                        className="px-2.5 py-1.5 rounded-lg bg-[#1B191E] border border-[#2D2A32] flex items-center justify-between gap-1 text-[11px] font-mono"
                      >
                        <div className="flex items-center gap-1.5 overflow-hidden">
                          <ArrowRight className="h-3 w-3 text-[#B8935F] flex-shrink-0" />
                          <span className="text-[#A8A399] truncate">{wallet}</span>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => handleCopy(wallet, e)}
                          className="p-1 text-[#7E7972] hover:text-[#EDE8DE] transition-colors flex-shrink-0"
                          title="Copy address"
                        >
                          {copiedAddress === wallet ? (
                            <Check className="h-3 w-3 text-emerald-400" />
                          ) : (
                            <Copy className="h-3 w-3" />
                          )}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Evidence IDs */}
              {cluster.evidence_ids && cluster.evidence_ids.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#26242A] flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#7E7972]">Evidence Custody:</span>
                  {cluster.evidence_ids.map((evId, idx) => (
                    <CitationChip
                      key={idx}
                      citation={`evidence:${evId}`}
                      onSelect={(_type, id) => onHighlightEdges?.([id])}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
