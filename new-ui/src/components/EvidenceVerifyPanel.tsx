import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  ShieldAlert,
  Upload,
  Loader2,
  FileCode,
  Hash,
  AlertTriangle,
  RotateCcw,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import {
  verifyEvidence,
  EvidenceBundle,
  EvidenceVerificationResult,
  EvidenceMismatch,
} from '../api/client';

interface EvidenceVerifyPanelProps {
  initialBundle?: EvidenceBundle | null;
  className?: string;
}

export function EvidenceVerifyPanel({ initialBundle, className = '' }: EvidenceVerifyPanelProps) {
  const [bundle, setBundle] = useState<EvidenceBundle | null>(initialBundle || null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<EvidenceVerificationResult | null>(null);
  const [tamperedFileName, setTamperedFileName] = useState<string | null>(null);

  useEffect(() => {
    if (initialBundle) {
      setBundle(initialBundle);
      setResult(null);
      setTamperedFileName(null);
    }
  }, [initialBundle]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.manifest && parsed.files) {
          setBundle(parsed);
          setResult(null);
          setTamperedFileName(null);
        } else {
          alert('Invalid evidence package structure. File must contain manifest and files.');
        }
      } catch {
        alert('Failed to parse evidence bundle JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleVerify = async () => {
    if (!bundle || loading) return;
    try {
      setLoading(true);
      const res = await verifyEvidence(bundle);
      setResult(res);
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Demo Beat: Deliberately flip 1 byte in trace_ledger_manifest.json
  const handleCorruptOneByte = () => {
    if (!bundle) return;
    const targetFile = bundle.files[0];
    if (!targetFile) return;

    // Flip or append 1 byte to the content string
    const originalContent = targetFile.content;
    const corruptedContent = originalContent.endsWith(' ')
      ? originalContent.slice(0, -1) + 'X'
      : originalContent + ' ';

    const updatedFiles = bundle.files.map((f, i) => (i === 0 ? { ...f, content: corruptedContent } : f));

    setBundle({
      ...bundle,
      files: updatedFiles,
    });
    setTamperedFileName(targetFile.name);
    setResult(null);
  };

  const handleResetBundle = () => {
    if (initialBundle) {
      setBundle(initialBundle);
    }
    setTamperedFileName(null);
    setResult(null);
  };

  return (
    <div className={`p-5 rounded-xl bg-[#161418] border border-[#2A272D] space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#2A272D]">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-[#3B6B54]/20 border border-[#3B6B54]/40 text-[#34D399]">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#EDE8DE] font-mono tracking-wide">
              Tamper-Evident Verification Panel
            </h3>
            <p className="text-[11px] text-[#7E7972]">
              Bitwise validation of file contents against cryptographic SHA-256 manifest digests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* File Upload Button */}
          <label className="px-3 py-1.5 rounded-lg bg-[#242227] hover:bg-[#2C2930] border border-[#2E2B32] text-xs font-mono text-[#EDE8DE] flex items-center gap-1.5 cursor-pointer transition-colors">
            <Upload className="h-3.5 w-3.5 text-[#B8935F]" />
            <span>Load Bundle JSON</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {bundle && (
            <button
              type="button"
              onClick={handleResetBundle}
              title="Reset bundle to clean state"
              className="p-1.5 rounded text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {!bundle ? (
        <div className="p-8 text-center border border-dashed border-[#2A272D] rounded-xl bg-[#141215] space-y-3">
          <Upload className="h-8 w-8 mx-auto text-[#7E7972] opacity-50" />
          <div className="max-w-md mx-auto">
            <p className="text-xs font-medium text-[#EDE8DE]">No Evidence Package Loaded</p>
            <p className="text-[11px] text-[#7E7972] mt-0.5">
              Click &quot;Generate Evidence Bundle&quot; above or load an exported evidence JSON file to test tamper
              detection.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active Bundle Bar & Demo Actions */}
          <div className="p-3 rounded-lg bg-[#1A181D] border border-[#2E2B32] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-mono uppercase text-[#7E7972] block">Active Verification Target:</span>
              <span className="text-xs font-mono font-medium text-[#EDE8DE]">{bundle.manifest.bundle_id}</span>
              <p className="text-[10px] text-[#7E7972] font-mono">
                {bundle.files.length} artifacts • {bundle.manifest.total_size_bytes} total bytes
              </p>
            </div>

            <div className="flex items-center gap-2">
              {/* Demo Beat: Deliberately flip 1 byte button */}
              <button
                type="button"
                onClick={handleCorruptOneByte}
                title="Deliberately tamper with 1 byte in the manifest file to demonstrate SHA-256 detection"
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition-colors cursor-pointer ${
                  tamperedFileName
                    ? 'bg-[#8C3B3B]/30 border border-[#8C3B3B]/60 text-[#E05A47]'
                    : 'bg-[#C68A4C]/15 hover:bg-[#C68A4C]/25 border border-[#C68A4C]/40 text-[#C68A4C]'
                }`}
              >
                <Zap className="h-3.5 w-3.5" />
                <span>{tamperedFileName ? '1 Byte Corrupted (Tampered)' : 'Deliberately Corrupt 1 Byte'}</span>
              </button>

              {/* Verify Trigger */}
              <button
                type="button"
                onClick={handleVerify}
                disabled={loading}
                className="px-4 py-1.5 rounded-lg bg-[#3B6B54] hover:bg-[#4E8B6D] text-[#131114] text-xs font-mono font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-sm disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
                <span>Verify Bitwise Hashes</span>
              </button>
            </div>
          </div>

          {/* Tamper Notification Banner */}
          {tamperedFileName && !result && (
            <div className="p-3 rounded-lg bg-[#C68A4C]/15 border border-[#C68A4C]/40 text-xs text-[#C68A4C] flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>
                Demonstration Notice: 1 byte was altered in <strong>{tamperedFileName}</strong>. Click &quot;Verify
                Bitwise Hashes&quot; to observe the cryptographic mismatch report.
              </span>
            </div>
          )}

          {/* Verification Result Display */}
          {result && (
            <div className="space-y-3 animate-fadeIn">
              {result.valid ? (
                <div className="p-4 rounded-xl bg-[#3B6B54]/20 border border-[#3B6B54]/60 text-[#34D399] flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#34D399]" />
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
                      Cryptographic Integrity Verified
                    </h4>
                    <p className="text-[11px] text-[#A8A399] mt-0.5 leading-relaxed">
                      All {result.verified_file_count} artifacts bitwise-match their registered SHA-256 digests in the
                      signed manifest. No file modifications or corruption detected.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#8C3B3B]/20 border border-[#8C3B3B]/70 text-[#E05A47] space-y-3">
                  <div className="flex items-start gap-3">
                    <ShieldAlert className="h-5 w-5 flex-shrink-0 mt-0.5 text-[#E05A47]" />
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wider font-mono">
                        Tampering Detected: Hash Mismatch Identified
                      </h4>
                      <p className="text-[11px] text-[#A8A399] mt-0.5 leading-relaxed">
                        The cryptographic digest for {result.mismatches.length} artifact(s) does not match the sealed
                        manifest. The bundle integrity has been compromised.
                      </p>
                    </div>
                  </div>

                  {/* Specific, Legible Mismatch Report (Acceptance Criteria Requirement) */}
                  <div className="space-y-2 pt-2 border-t border-[#8C3B3B]/30">
                    <span className="text-[10px] font-mono uppercase text-[#E05A47] font-semibold tracking-wider block">
                      Discrepancy Breakdown ({result.mismatches.length} Mismatches):
                    </span>
                    {result.mismatches.map((m: EvidenceMismatch, idx: number) => (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-[#141215] border border-[#8C3B3B]/40 space-y-2 font-mono text-xs"
                      >
                        <div className="flex items-center justify-between text-[#EDE8DE]">
                          <div className="flex items-center gap-2 overflow-hidden">
                            <FileCode className="h-4 w-4 text-[#E05A47] flex-shrink-0" />
                            <span className="font-semibold truncate">{m.filename}</span>
                          </div>
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#8C3B3B]/30 border border-[#8C3B3B]/60 text-[#E05A47]">
                            {m.status}
                          </span>
                        </div>

                        {/* Expected vs Actual Hash Side-by-Side */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px]">
                          <div className="p-2 rounded bg-[#1C1A1E] border border-[#2E2B32]">
                            <span className="text-[10px] text-[#7E7972] block uppercase">
                              Expected Manifest Digest:
                            </span>
                            <span className="text-[#34D399] break-all">{m.expected_sha256}</span>
                          </div>
                          <div className="p-2 rounded bg-[#1C1A1E] border border-[#8C3B3B]/40">
                            <span className="text-[10px] text-[#E05A47] block uppercase">
                              Actual Computed Digest:
                            </span>
                            <span className="text-[#E05A47] break-all font-semibold">{m.actual_sha256}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
