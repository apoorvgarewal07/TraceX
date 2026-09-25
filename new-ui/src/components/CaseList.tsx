import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCases } from '../hooks/useCase';
import { CaseItem } from '../api/client';
import {
  FolderOpen,
  Plus,
  Search,
  ExternalLink,
  Shield,
  Loader2,
  AlertCircle,
  Copy,
  Check,
  Radio,
  Clock,
} from 'lucide-react';

export function CaseList() {
  const { cases, loading, error, refresh } = useCases(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const filteredCases = cases.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      c.case_id.toLowerCase().includes(q) ||
      c.complaint_ref.toLowerCase().includes(q) ||
      c.fraud_tx_hash.toLowerCase().includes(q) ||
      c.complaint_source.toLowerCase().includes(q)
    );
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-[#3B6B54]/20 text-[#34D399] border-[#3B6B54]/40';
      case 'TRACING':
        return 'bg-[#B8935F]/20 text-[#CFAC78] border-[#B8935F]/40 animate-pulse';
      case 'FLAGGED':
        return 'bg-[#8C3B3B]/20 text-[#E05A47] border-[#8C3B3B]/40';
      case 'PENDING':
      default:
        return 'bg-[#2E2B32] text-[#A8A399] border-[#3D3A42]';
    }
  };

  return (
    <div className="w-full space-y-4 text-[#EDE8DE]">
      {/* Search and Action Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="h-4 w-4 absolute left-3 top-2.5 text-[#7E7972]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search docket, reference, or hash..."
            className="w-full rounded bg-[#161418] border border-[#2A272D] pl-9 pr-3 py-2 text-xs text-[#EDE8DE] placeholder-[#5A5560] focus:border-[#B8935F] outline-none"
          />
        </div>

        <Link
          to="/cases/new"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78] transition-colors shadow-sm"
        >
          <Plus className="h-4 w-4" />
          <span>New Case Dossier</span>
        </Link>
      </div>

      {/* Loading & Error States */}
      {loading && cases.length === 0 && (
        <div className="p-12 text-center text-[#A8A399] flex flex-col items-center justify-center bg-[#161418] border border-[#2A272D] rounded-lg">
          <Loader2 className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
          <p className="text-xs">Loading authorized forensic dossiers...</p>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-[#8C3B3B]/15 border border-[#8C3B3B]/40 text-xs text-[#E05A47] flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error Loading Cases</p>
            <p className="text-[11px] text-[#A8A399] mt-0.5">{error}</p>
            <button type="button" onClick={refresh} className="mt-2 text-[10px] text-[#CFAC78] underline">
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredCases.length === 0 && !error && (
        <div className="p-12 text-center text-[#7E7972] bg-[#161418] border border-[#2A272D] rounded-lg">
          <FolderOpen className="h-8 w-8 mx-auto mb-2 text-[#4A454F]" />
          <p className="text-sm font-medium text-[#EDE8DE]">No Case Dossiers Available</p>
          <p className="text-xs text-[#A8A399] mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No cases match '${searchQuery}'. Try a different search term.`
              : 'You have no assigned case dossiers. Register a new complaint to initiate a forensic attribution graph.'}
          </p>
          {!searchQuery && (
            <Link
              to="/cases/new"
              className="mt-4 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78]"
            >
              <Plus className="h-3.5 w-3.5" />
              Register First Case
            </Link>
          )}
        </div>
      )}

      {/* Case Dossiers Table */}
      {filteredCases.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-[#2A272D] bg-[#161418] shadow-md">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#121114] text-[#A8A399] border-b border-[#2A272D]">
                <th className="py-3 px-4 font-normal">Source & Reference</th>
                <th className="py-3 px-4 font-normal">Root Fraud TX Hash</th>
                <th className="py-3 px-4 font-normal">Ledger</th>
                <th className="py-3 px-4 font-normal">Status</th>
                <th className="py-3 px-4 font-normal">Data Mode</th>
                <th className="py-3 px-4 font-normal">Registered</th>
                <th className="py-3 px-4 font-normal text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#242227] text-[#EDE8DE]">
              {filteredCases.map((c) => (
                <tr key={c.case_id} className="hover:bg-[#1D1B20] transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-[#242227] px-1.5 py-0.5 rounded border border-[#2E2B32] text-[#B8935F]">
                        {c.complaint_source}
                      </span>
                      <span className="font-semibold text-xs text-[#EDE8DE]">{c.complaint_ref}</span>
                    </div>
                    <div className="text-[10px] text-[#7E7972] font-mono mt-0.5">{c.case_id}</div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-[11px] text-[#A8A399]">
                    <div className="flex items-center gap-1.5">
                      <span>
                        {c.fraud_tx_hash.slice(0, 10)}...{c.fraud_tx_hash.slice(-8)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(c.fraud_tx_hash, c.case_id)}
                        className="text-[#7E7972] hover:text-[#EDE8DE]"
                        title="Copy Transaction Hash"
                      >
                        {copiedId === c.case_id ? (
                          <Check className="h-3 w-3 text-[#34D399]" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </button>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-mono text-xs">{c.chain}</td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${getStatusBadge(
                        c.status
                      )}`}
                    >
                      {c.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-4">
                    <span
                      className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono border ${
                        c.data_mode === 'LIVE'
                          ? 'bg-[#3B6B54]/15 text-[#34D399] border-[#3B6B54]/40'
                          : 'bg-[#B8935F]/15 text-[#CFAC78] border-[#B8935F]/40'
                      }`}
                    >
                      <Radio className="h-2.5 w-2.5" />
                      {c.data_mode}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-[#A8A399] text-[11px] font-mono">
                    {c.created_at.slice(0, 10)}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <Link
                      to={`/cases/${c.case_id}`}
                      className="inline-flex items-center gap-1 px-3 py-1 rounded bg-[#242227] hover:bg-[#2F2C33] border border-[#2E2B32] text-xs text-[#EDE8DE] hover:text-[#CFAC78] transition-colors"
                    >
                      <span>Open Workspace</span>
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
