import React, { useState } from 'react';
import {
  FileArchive,
  Download,
  ShieldCheck,
  Lock,
  Loader2,
  Check,
  Copy,
  Hash,
  FileCode,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { exportEvidence, EvidenceBundle } from '../api/client';

interface EvidenceExportPanelProps {
  caseId: string;
  onBundleGenerated?: (bundle: EvidenceBundle) => void;
  className?: string;
}

export function EvidenceExportPanel({
  caseId,
  onBundleGenerated,
  className = '',
}: EvidenceExportPanelProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [exportedData, setExportedData] = useState<{
    bundle_id: string;
    download_url: string;
    bundle: EvidenceBundle;
  } | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Role gate: Only Investigator and Admin are authorized to export judicial evidence packages
  const canExport = user?.role === 'INVESTIGATOR' || user?.role === 'ADMIN';

  const handleExport = async () => {
    if (!canExport || loading) return;
    try {
      setLoading(true);
      setError(null);
      const res = await exportEvidence(caseId);
      setExportedData(res);
      if (onBundleGenerated) {
        onBundleGenerated(res.bundle);
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || err?.message || 'Failed to generate evidence package.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyBundleId = () => {
    if (!exportedData) return;
    navigator.clipboard.writeText(exportedData.bundle_id);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 1500);
  };

  return (
    <div className={`p-5 rounded-xl bg-[#161418] border border-[#2A272D] space-y-4 ${className}`}>
      {/* Panel Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A272D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#B8935F]/15 border border-[#B8935F]/30 text-[#B8935F]">
            <FileArchive className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#EDE8DE] font-mono tracking-wide">
              Evidence Export Package
            </h3>
            <p className="text-[11px] text-[#7E7972]">
              Cryptographic SHA-256 sealed bundle of ledger hops, rule findings, and chain-of-custody logs
            </p>
          </div>
        </div>

        {/* Export Trigger Button */}
        <div>
          <button
            type="button"
            onClick={handleExport}
            disabled={!canExport || loading}
            title={
              !canExport
                ? 'Role restricted: Export requires Investigator or Administrator role'
                : 'Generate cryptographic evidence bundle'
            }
            className={`px-4 py-2 rounded-lg text-xs font-semibold font-mono flex items-center gap-2 transition-all cursor-pointer ${
              canExport
                ? 'bg-[#B8935F] hover:bg-[#CFAC78] text-[#131114] shadow-md hover:shadow-lg'
                : 'bg-[#242227] text-[#7E7972] border border-[#2E2B32] cursor-not-allowed opacity-60'
            }`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : !canExport ? (
              <Lock className="h-4 w-4 text-[#E05A47]" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            <span>{loading ? 'Compiling Artifacts...' : 'Generate Evidence Bundle'}</span>
          </button>
        </div>
      </div>

      {/* Role Notice if not authorized */}
      {!canExport && (
        <div className="p-3 rounded-lg bg-[#8C3B3B]/10 border border-[#8C3B3B]/30 text-xs text-[#E05A47] flex items-center gap-2">
          <Lock className="h-4 w-4 flex-shrink-0" />
          <span>
            Role Restricted: Your current account role ({user?.role || 'ANALYST'}) has read-only access. Exporting
            sealed judicial bundles requires Investigator or Admin credentials.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-[#8C3B3B]/15 border border-[#8C3B3B]/40 text-xs text-[#E05A47] flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Export Result Card */}
      {exportedData && (
        <div className="space-y-4 p-4 rounded-xl bg-[#1A181D] border border-[#3E3844] animate-fadeIn">
          {/* Bundle Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#2A272D]">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#7E7972] block">Package Identifier:</span>
              <div className="flex items-center gap-1.5 font-mono text-xs text-[#EDE8DE] font-medium">
                <span>{exportedData.bundle_id}</span>
                <button
                  type="button"
                  onClick={handleCopyBundleId}
                  className="p-1 rounded text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors"
                  title="Copy bundle ID"
                >
                  {copiedId ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                </button>
              </div>
            </div>

            <a
              href={exportedData.download_url}
              download={`TRACEX_EVIDENCE_${caseId}.json`}
              className="px-3.5 py-1.5 rounded-lg bg-[#3B6B54]/20 hover:bg-[#3B6B54]/30 border border-[#3B6B54]/50 text-[#34D399] text-xs font-mono font-medium flex items-center gap-1.5 transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Download Evidence Package (.json)</span>
            </a>
          </div>

          {/* Included Artifacts List */}
          <div className="space-y-2">
            <span className="text-[10px] font-mono uppercase text-[#7E7972] tracking-wider block">
              Sealed Artifacts ({exportedData.bundle.files.length}):
            </span>
            <div className="space-y-2">
              {exportedData.bundle.files.map((file, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-[#141215] border border-[#28262C] space-y-1.5 font-mono text-xs"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileCode className="h-3.5 w-3.5 text-[#B8935F] flex-shrink-0" />
                      <span className="text-[#EDE8DE] font-semibold truncate">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-[#7E7972] flex-shrink-0">{file.size} bytes</span>
                  </div>
                  <p className="text-[11px] text-[#7E7972] font-sans">{file.description}</p>
                  <div className="flex items-center gap-1.5 pt-1 text-[10px] text-[#A8A399] overflow-hidden">
                    <Hash className="h-3 w-3 text-[#B8935F] flex-shrink-0" />
                    <span className="opacity-75">SHA-256:</span>
                    <span className="truncate text-[#B8935F]">{file.sha256}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Root Merkle Seal */}
          <div className="p-2.5 rounded-lg bg-[#241F1C] border border-[#B8935F]/30 flex items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[10px] uppercase text-[#B8935F] font-semibold flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Overall Merkle Digest:
            </span>
            <span className="text-[#EDE8DE] truncate text-[11px]">
              {exportedData.bundle.manifest.overall_merkle_root}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
