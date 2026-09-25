import React, { useState } from 'react';
import { Search, Loader2, CheckCircle2, AlertCircle, Hash, Play } from 'lucide-react';

interface FraudTxPickerProps {
  caseId: string;
  initialHash?: string;
  chain?: string;
  isTracing?: boolean;
  onSubmitTrace: (fraudTxHash: string) => Promise<void> | void;
  disabled?: boolean;
}

const SAMPLE_TX = '0x4a8b79234c01f68749e7b2f0a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1';

export function FraudTxPicker({
  caseId,
  initialHash = '',
  chain = 'ETH',
  isTracing = false,
  onSubmitTrace,
  disabled = false,
}: FraudTxPickerProps) {
  const [txHash, setTxHash] = useState<string>(initialHash);
  const [error, setError] = useState<string | null>(null);

  const cleanHash = txHash.trim().toLowerCase();
  const isValidFormat = Boolean(cleanHash.match(/^0x[a-f0-9]{64}$/));

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTxHash(val);

    if (!val.trim()) {
      setError(null);
      return;
    }

    const cleaned = val.trim().toLowerCase();
    if (!cleaned.startsWith('0x')) {
      setError("Transaction hash must start with '0x'.");
    } else if (cleaned.length !== 66) {
      setError(`Transaction hash must be exactly 66 characters (currently ${cleaned.length}).`);
    } else if (!cleaned.match(/^0x[a-f0-9]{64}$/)) {
      setError('Contains invalid characters. Only hexadecimal (0-9, a-f) permitted.');
    } else {
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isValidFormat) {
      setError('Please provide a valid 66-character EVM transaction hash before launching.');
      return;
    }

    setError(null);
    await onSubmitTrace(cleanHash);
  };

  const handleQuickFill = () => {
    setTxHash(SAMPLE_TX);
    setError(null);
  };

  return (
    <div className="bg-[#18161A] border border-[#2A272D] rounded-lg p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <label htmlFor="fraud-tx-input" className="block text-xs font-semibold text-[#EDE8DE] flex items-center gap-1.5">
          <Hash className="h-3.5 w-3.5 text-[#B8935F]" />
          Root Fraud Transaction Hash
        </label>
        <span className="text-[10px] text-[#A8A399] font-mono bg-[#131114] px-2 py-0.5 rounded border border-[#242227]">
          {chain.toUpperCase()} • Direct TX Provenance
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="relative">
          <input
            id="fraud-tx-input"
            type="text"
            value={txHash}
            onChange={handleChange}
            disabled={disabled || isTracing}
            placeholder="0x4a8b79234c01f68749e7b2f0a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1"
            className={`w-full rounded bg-[#121114] px-3.5 py-2.5 text-xs font-mono text-[#EDE8DE] placeholder-[#5A5560] border transition-colors outline-none pr-24 ${
              error
                ? 'border-[#8C3B3B] focus:border-[#E05A47]'
                : isValidFormat
                ? 'border-[#3B6B54] focus:border-[#34D399]'
                : 'border-[#2E2B32] focus:border-[#B8935F]'
            }`}
          />

          <div className="absolute right-2 top-2 flex items-center gap-1.5 text-[10px] font-mono">
            {isValidFormat ? (
              <span className="flex items-center gap-1 text-[#34D399] bg-[#3B6B54]/20 px-1.5 py-0.5 rounded border border-[#3B6B54]/40">
                <CheckCircle2 className="h-3 w-3" /> 66 chars
              </span>
            ) : txHash ? (
              <span className="text-[#A8A399]">{txHash.trim().length}/66</span>
            ) : null}
          </div>
        </div>

        {error && (
          <div className="flex items-center gap-1.5 text-xs text-[#E05A47]">
            <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <button
            type="button"
            onClick={handleQuickFill}
            disabled={disabled || isTracing}
            className="text-[11px] text-[#A8A399] hover:text-[#CFAC78] underline transition-colors"
          >
            Quick-fill benchmark transaction
          </button>

          <button
            type="submit"
            disabled={!isValidFormat || disabled || isTracing}
            className="inline-flex items-center gap-2 px-4 py-2 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78] transition-all disabled:opacity-40 disabled:pointer-events-none shadow-sm"
          >
            {isTracing ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Tracing Ledger...</span>
              </>
            ) : (
              <>
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Launch Forensics Trace</span>
              </>
            )}
          </button>
        </div>
      </form>

      <p className="text-[11px] text-[#7E7972] leading-relaxed">
        Initiates FIFO taint-tracking traversal from the root fraud transaction hash rather than an unconstrained wallet balance.
      </p>
    </div>
  );
}
