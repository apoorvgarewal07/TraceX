import React, { useState } from 'react';
import { Finding, FindingSeverity } from '../api/client';
import { useFindings } from '../hooks/useFindings';
import { FindingCard } from './FindingCard';
import {
  ShieldAlert,
  RotateCw,
  X,
  SlidersHorizontal,
  Layers,
  Sparkles,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface FindingsDrawerProps {
  traceId?: string;
  isOpen?: boolean;
  onClose?: () => void;
  highlightedEdgeIds?: string[];
  onHighlightEdges?: (edgeIds: string[]) => void;
  className?: string;
}

export function FindingsDrawer({
  traceId,
  isOpen = true,
  onClose,
  highlightedEdgeIds = [],
  onHighlightEdges,
  className = '',
}: FindingsDrawerProps) {
  const { findings, loading, error, recompute, refresh } = useFindings(traceId);
  const [severityFilter, setSeverityFilter] = useState<'all' | FindingSeverity>('all');
  const [activeFindingId, setActiveFindingId] = useState<string | null>(null);

  if (!isOpen) return null;

  // Counts by severity
  const highCount = findings.filter((f) => f.severity === 'high').length;
  const medCount = findings.filter((f) => f.severity === 'medium').length;
  const lowCount = findings.filter((f) => f.severity === 'low').length;

  const filteredFindings = findings.filter((f) => {
    if (severityFilter === 'all') return true;
    return f.severity === severityFilter;
  });

  const handleToggleHighlight = (finding: Finding) => {
    if (activeFindingId === finding.finding_id) {
      setActiveFindingId(null);
      onHighlightEdges?.([]);
    } else {
      setActiveFindingId(finding.finding_id);
      onHighlightEdges?.(finding.evidence_edge_ids || []);
    }
  };

  return (
    <div
      className={`flex flex-col bg-[#161418] border-l border-[#2A272D] text-[#EDE8DE] h-full ${className}`}
    >
      {/* Drawer Header */}
      <div className="p-4 border-b border-[#2A272D] bg-[#141215]">
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4 text-[#B8935F]" />
            <h2 className="font-serif text-base font-medium text-[#EDE8DE]">
              Deterministic Findings (R1–R8)
            </h2>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={recompute}
              disabled={loading}
              title="Recompute rules over trace edges"
              className="p-1.5 rounded text-[#A8A399] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors disabled:opacity-50"
            >
              <RotateCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin text-[#B8935F]' : ''}`} />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded text-[#A8A399] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Severity Metrics Bar */}
        <div className="flex items-center gap-1.5 text-xs text-[#A8A399]">
          <span className="bg-[#1F1C22] px-2 py-0.5 rounded text-[11px] border border-[#2E2B32]">
            {findings.length} Total
          </span>
          {highCount > 0 && (
            <span className="bg-[#8C3B3B]/15 text-[#E05A47] border border-[#8C3B3B]/40 px-2 py-0.5 rounded text-[11px]">
              {highCount} High
            </span>
          )}
          {medCount > 0 && (
            <span className="bg-[#B8935F]/15 text-[#CFAC78] border border-[#B8935F]/40 px-2 py-0.5 rounded text-[11px]">
              {medCount} Medium
            </span>
          )}
          {lowCount > 0 && (
            <span className="bg-[#3B6B54]/15 text-[#34D399] border border-[#3B6B54]/40 px-2 py-0.5 rounded text-[11px]">
              {lowCount} Info
            </span>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="px-4 py-2 border-b border-[#242227] bg-[#18161A] flex items-center justify-between text-xs">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setSeverityFilter('all')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              severityFilter === 'all'
                ? 'bg-[#242227] text-[#EDE8DE] font-medium'
                : 'text-[#7E7972] hover:text-[#EDE8DE]'
            }`}
          >
            All ({findings.length})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('high')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              severityFilter === 'high'
                ? 'bg-[#8C3B3B]/20 text-[#E05A47] font-medium'
                : 'text-[#7E7972] hover:text-[#E05A47]'
            }`}
          >
            High ({highCount})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('medium')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              severityFilter === 'medium'
                ? 'bg-[#B8935F]/20 text-[#CFAC78] font-medium'
                : 'text-[#7E7972] hover:text-[#CFAC78]'
            }`}
          >
            Medium ({medCount})
          </button>
          <button
            type="button"
            onClick={() => setSeverityFilter('low')}
            className={`px-2 py-1 rounded text-[11px] transition-colors ${
              severityFilter === 'low'
                ? 'bg-[#3B6B54]/20 text-[#34D399] font-medium'
                : 'text-[#7E7972] hover:text-[#34D399]'
            }`}
          >
            Info ({lowCount})
          </button>
        </div>

        {highlightedEdgeIds.length > 0 && (
          <button
            type="button"
            onClick={() => {
              setActiveFindingId(null);
              onHighlightEdges?.([]);
            }}
            className="text-[10px] text-[#B8935F] hover:underline"
          >
            Reset highlight ({highlightedEdgeIds.length})
          </button>
        )}
      </div>

      {/* Findings List Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading && findings.length === 0 && (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#7E7972]">
            <RotateCw className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
            <p className="text-xs">Evaluating deterministic forensic rules...</p>
          </div>
        )}

        {error && (
          <div className="rounded border border-[#8C3B3B]/40 bg-[#8C3B3B]/10 p-3 text-xs text-[#E05A47] flex items-start gap-2">
            <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium">Rule Engine Notice</p>
              <p className="text-[11px] text-[#A8A399] mt-0.5">{error}</p>
              <button
                type="button"
                onClick={refresh}
                className="mt-2 text-[10px] text-[#CFAC78] underline"
              >
                Retry Query
              </button>
            </div>
          </div>
        )}

        {!loading && findings.length === 0 && !error && (
          <div className="p-8 text-center text-[#7E7972]">
            <HelpCircle className="h-7 w-7 mx-auto mb-2 text-[#4A454F]" />
            <p className="text-xs font-medium text-[#A8A399]">No Rule Violations Found</p>
            <p className="text-[11px] text-[#7E7972] mt-1 max-w-xs mx-auto">
              No rapid pass-through, peel chains, fan-out, privacy mixers, or exchange exits matched the active trace edges.
            </p>
          </div>
        )}

        {filteredFindings.map((finding) => (
          <FindingCard
            key={finding.finding_id}
            finding={finding}
            isHighlighted={
              activeFindingId === finding.finding_id ||
              (finding.evidence_edge_ids.length > 0 &&
                finding.evidence_edge_ids.every((id) => highlightedEdgeIds.includes(id)))
            }
            onToggleHighlight={() => handleToggleHighlight(finding)}
          />
        ))}
      </div>
    </div>
  );
}
