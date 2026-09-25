import React, { useState, useEffect } from 'react';
import {
  FileText,
  Copy,
  Check,
  Download,
  AlertCircle,
  Building2,
  Scale,
  Loader2,
  Info,
} from 'lucide-react';
import { generateNoticeDraft, NoticeDraftResult, ExitDetail } from '../api/client';

interface NoticeDraftPreviewProps {
  caseId: string;
  defaultExit?: ExitDetail | null;
  className?: string;
}

export function NoticeDraftPreview({
  caseId,
  defaultExit,
  className = '',
}: NoticeDraftPreviewProps) {
  const [draft, setDraft] = useState<NoticeDraftResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [targetVasp, setTargetVasp] = useState(defaultExit?.vasp_name || 'Binance Compliance Desk');
  const [targetWallet, setTargetWallet] = useState(
    defaultExit?.wallet || '0x28c6c06298d514db089934071355e5743bf21d60'
  );

  useEffect(() => {
    let mounted = true;
    async function loadDraft() {
      try {
        setLoading(true);
        const res = await generateNoticeDraft({
          case_id: caseId,
          vasp_name: targetVasp,
          target_wallet: targetWallet,
          attributed_amount: 'Attributed Stolen Proceeds (FIFO Traced)',
          terminal_tx_hash: '0x9a8f4c2e17bd88390f77163c45b81a0293740284',
          agency_ref: `NCRP-REF-${caseId.slice(0, 8).toUpperCase()}`,
        });
        if (mounted) setDraft(res);
      } catch (err) {
        console.error('Failed to generate neutral notice draft:', err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadDraft();
    return () => {
      mounted = false;
    };
  }, [caseId, targetVasp, targetWallet]);

  const handleCopy = () => {
    if (!draft) return;
    navigator.clipboard.writeText(draft.notice_text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    if (!draft) return;
    const blob = new Blob([draft.notice_text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Draft_Information_Request_${targetVasp.replace(/\s+/g, '_')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`p-5 rounded-xl bg-[#161418] border border-[#2A272D] space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A272D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#B8935F]/15 border border-[#B8935F]/30 text-[#B8935F]">
            <FileText className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#EDE8DE] font-mono tracking-wide">
              Neutral Statutory Information Request Draft
            </h3>
            <p className="text-[11px] text-[#7E7972]">
              Administrative draft for statutory review by authorized officer under CrPC s. 91 / BNSS s. 94
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCopy}
            disabled={!draft || loading}
            className="px-3 py-1.5 rounded-lg bg-[#242227] hover:bg-[#2E2B32] border border-[#2E2B32] text-xs font-mono text-[#EDE8DE] flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
            <span>{copied ? 'Copied' : 'Copy Text'}</span>
          </button>

          <button
            type="button"
            onClick={handleDownload}
            disabled={!draft || loading}
            className="px-3 py-1.5 rounded-lg bg-[#B8935F] hover:bg-[#CFAC78] text-[#131114] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <Download className="h-3.5 w-3.5" />
            <span>Download Draft (.txt)</span>
          </button>
        </div>
      </div>

      {/* Explicit Legal Neutrality Disclaimer (Blueprint Requirement) */}
      <div className="p-3.5 rounded-lg bg-[#1C1A1E] border border-[#B8935F]/30 text-xs text-[#A8A399] space-y-1.5">
        <div className="flex items-center gap-2 text-[#B8935F] font-semibold text-[11px] uppercase tracking-wider font-mono">
          <Info className="h-4 w-4" />
          <span>Statutory Notice Neutrality Policy</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          This document is an administrative draft proposal compiled from cryptographic ledger traces. In accordance
          with Indian procedural laws, this draft carries <strong>no automatic legal effect</strong>, makes{' '}
          <strong>no determination of judicial guilt or liability</strong>, and does not claim court-admissibility
          without independent officer attestation.
        </p>
      </div>

      {loading ? (
        <div className="p-10 text-center text-[#A8A399] flex flex-col items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
          <p className="text-xs">Generating neutral notice draft text...</p>
        </div>
      ) : draft ? (
        <div className="space-y-3">
          {/* Target Parameters Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-[#141215] border border-[#26242A] text-xs font-mono">
            <div>
              <span className="text-[10px] text-[#7E7972] uppercase block">Target Entity (VASP):</span>
              <span className="text-[#EDE8DE] font-semibold">{draft.target_vasp}</span>
            </div>
            <div>
              <span className="text-[10px] text-[#7E7972] uppercase block">Suspect Deposit Identifier:</span>
              <span className="text-[#B8935F] truncate block">{draft.target_wallet}</span>
            </div>
          </div>

          {/* Draft Notice Text Box */}
          <div className="p-4 rounded-xl bg-[#141215] border border-[#2D2A32] font-mono text-xs text-[#EDE8DE] whitespace-pre-wrap leading-relaxed select-text shadow-inner">
            {draft.notice_text}
          </div>
        </div>
      ) : (
        <div className="p-6 text-center text-xs text-[#E05A47]">Failed to load notice draft.</div>
      )}
    </div>
  );
}
