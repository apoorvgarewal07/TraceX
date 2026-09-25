import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ComplaintSource, CreateCasePayload } from '../api/client';
import { useCases } from '../hooks/useCase';
import { Shield, FilePlus, Loader2, AlertCircle, Hash, HelpCircle, ArrowLeft } from 'lucide-react';

interface CaseCreateFormProps {
  onCancel?: () => void;
}

const SAMPLE_TX = '0x4a8b79234c01f68749e7b2f0a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1';

export function CaseCreateForm({ onCancel }: CaseCreateFormProps) {
  const navigate = useNavigate();
  const { createNewCase, loading } = useCases();

  const [source, setSource] = useState<ComplaintSource>('NCRP');
  const [complaintRef, setComplaintRef] = useState<string>('');
  const [chain, setChain] = useState<string>('ETH');
  const [fraudTxHash, setFraudTxHash] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!complaintRef.trim()) {
      setError('Please provide a complaint docket or reference number.');
      return;
    }

    const cleanHash = fraudTxHash.trim().toLowerCase();
    if (!cleanHash.match(/^0x[a-f0-9]{64}$/)) {
      setError('Invalid fraud transaction hash. Must be 0x followed by exactly 64 hexadecimal characters.');
      return;
    }

    setError(null);
    try {
      const payload: CreateCasePayload = {
        complaint_source: source,
        complaint_ref: complaintRef.trim(),
        fraud_tx_hash: cleanHash,
        chain,
      };

      const created = await createNewCase(payload);
      navigate(`/cases/${created.case_id}`);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to create case dossier.';
      setError(msg);
    }
  };

  const handleQuickFill = () => {
    setSource('NCRP');
    setComplaintRef(`NCRP-2026-${Math.floor(10000 + Math.random() * 90000)}`);
    setChain('ETH');
    setFraudTxHash(SAMPLE_TX);
    setError(null);
  };

  return (
    <div className="w-full max-w-xl mx-auto bg-[#161418] border border-[#2A272D] rounded-xl p-6 shadow-xl text-[#EDE8DE]">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-[#2A272D] mb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-[#242027] border border-[#3A3540] flex items-center justify-center text-[#B8935F]">
            <FilePlus className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-serif text-lg font-medium text-[#EDE8DE]">
              Register Forensic Case Dossier
            </h2>
            <p className="text-xs text-[#A8A399]">
              LEO Attribution Workspace • Indian Law Enforcement (I4C / MHA)
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleQuickFill}
          className="text-xs text-[#B8935F] hover:text-[#CFAC78] underline"
        >
          Quick Demo Fill
        </button>
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-[#8C3B3B]/15 border border-[#8C3B3B]/40 p-3 text-xs text-[#E05A47] flex items-start gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Validation Error</p>
            <p className="text-[11px] text-[#A8A399] mt-0.5">{error}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Row 1: Source & Chain */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-[#EDE8DE] mb-1.5">
              Complaint Source
            </label>
            <select
              value={source}
              onChange={(e) => setSource(e.target.value as ComplaintSource)}
              className="w-full rounded bg-[#121114] border border-[#2E2B32] px-3 py-2 text-xs text-[#EDE8DE] focus:border-[#B8935F] outline-none"
            >
              <option value="NCRP">NCRP (National Cybercrime Portal)</option>
              <option value="SAHYOG">SAHYOG (MHA Inter-Agency Desk)</option>
              <option value="POLICE_PORTAL">State Police Cyber Cell</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#EDE8DE] mb-1.5">
              Blockchain Ledger
            </label>
            <select
              value={chain}
              onChange={(e) => setChain(e.target.value)}
              className="w-full rounded bg-[#121114] border border-[#2E2B32] px-3 py-2 text-xs text-[#EDE8DE] focus:border-[#B8935F] outline-none"
            >
              <option value="ETH">Ethereum Mainnet (ETH)</option>
              <option value="POLYGON">Polygon PoS (POL)</option>
            </select>
          </div>
        </div>

        {/* Row 2: Complaint Reference Docket */}
        <div>
          <label className="block text-xs font-medium text-[#EDE8DE] mb-1.5">
            Complaint Reference / Docket No.
          </label>
          <input
            type="text"
            value={complaintRef}
            onChange={(e) => setComplaintRef(e.target.value)}
            placeholder="e.g. NCRP-2026-90412"
            required
            className="w-full rounded bg-[#121114] border border-[#2E2B32] px-3 py-2 text-xs font-mono text-[#EDE8DE] placeholder-[#5A5560] focus:border-[#B8935F] outline-none"
          />
        </div>

        {/* Row 3: Root Fraud Transaction Hash */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs font-medium text-[#EDE8DE] flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-[#B8935F]" />
              Root Fraud Transaction Hash
            </label>
            <span className="text-[10px] text-[#7E7972] font-mono">
              66-char EVM hex hash
            </span>
          </div>
          <input
            type="text"
            value={fraudTxHash}
            onChange={(e) => setFraudTxHash(e.target.value)}
            placeholder="0x4a8b79234c01f68749e7b2f0a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"
            required
            className="w-full rounded bg-[#121114] border border-[#2E2B32] px-3 py-2 text-xs font-mono text-[#EDE8DE] placeholder-[#5A5560] focus:border-[#B8935F] outline-none"
          />
          <p className="text-[11px] text-[#7E7972] mt-1">
            Specify the initial transfer or contract drain transaction. Trace will propagate taint from this hash.
          </p>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#2A272D]">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 rounded text-xs text-[#A8A399] hover:text-[#EDE8DE] transition-colors"
            >
              Cancel
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78] transition-colors disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Dossier...</span>
              </>
            ) : (
              <>
                <Shield className="h-4 w-4" />
                <span>Register Case & Open Workspace</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
