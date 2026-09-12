import { useState } from 'react';
import { ForensicCase } from '../types';
import {
  AlertTriangle,
  Building2,
  FileText,
  Download,
  Send,
  CheckCircle2,
  Copy,
  Check,
  UserCheck,
  Mail,
  Phone,
} from 'lucide-react';

interface RightPanelProps {
  currentCase: ForensicCase;
  activeHop: number;
  onOpenNotice: () => void;
  onOpenExport: () => void;
}

export function RightPanel({
  currentCase,
  activeHop,
  onOpenNotice,
  onOpenExport,
}: RightPanelProps) {
  const [copiedUid, setCopiedUid] = useState(false);
  const [registrySynced, setRegistrySynced] = useState(false);
  const { exchange, riskScore, riskFactors } = currentCase;

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(true);
    setTimeout(() => setCopiedUid(false), 2000);
  };

  const handleSyncRegistry = () => {
    setRegistrySynced(true);
    setTimeout(() => setRegistrySynced(false), 3000);
  };

  const severityColor =
    riskScore >= 70
      ? 'text-[#8C3B3B] border-[#8C3B3B]'
      : riskScore >= 40
      ? 'text-[#B8935F] border-[#B8935F]'
      : 'text-[#3B6B54] border-[#3B6B54]';

  const severityBg =
    riskScore >= 70
      ? 'bg-[#8C3B3B]/10'
      : riskScore >= 40
      ? 'bg-[#B8935F]/10'
      : 'bg-[#3B6B54]/10';

  const severityLabel =
    riskScore >= 70
      ? 'High Severity • Anomalous Flow'
      : riskScore >= 40
      ? 'Moderate Threat • Multi-Hop Mule'
      : 'Low Threat • Standard Flow';

  return (
    <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[#2A272D] bg-[#161418] overflow-y-auto">
      {/* Risk Assessment Header */}
      <div className="p-5 border-b border-[#2A272D]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-medium text-[#B8935F] tracking-wide">
            Forensic Risk Scoring
          </span>
          <span className="text-[11px] text-[#A8A399] bg-[#1C1A1E] px-2 py-0.5 rounded border border-[#2E2B32]">
            AML Anomaly Metric
          </span>
        </div>
        <h2 className="font-serif text-xl font-normal text-[#EDE8DE] leading-snug">
          Threat Assessment
        </h2>

        {/* Risk Score Meter */}
        <div className="mt-4 panel-dossier rounded p-3.5 flex items-center justify-between">
          <div>
            <div className="text-[11px] text-[#A8A399]">Calculated Threat Index</div>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className={`font-serif text-3xl font-semibold ${severityColor.split(' ')[0]}`}>
                {riskScore}
              </span>
              <span className="text-xs text-[#7E7972]">/ 100</span>
            </div>
            <div className={`text-[11px] font-medium mt-0.5 ${severityColor.split(' ')[0]}`}>
              {severityLabel}
            </div>
          </div>

          <div className={`h-12 w-12 rounded-full border-2 ${severityColor.split(' ')[1]} flex items-center justify-center ${severityBg}`}>
            <AlertTriangle className={`h-6 w-6 ${severityColor.split(' ')[0]}`} />
          </div>
        </div>

        {/* Risk Breakdown Items */}
        <div className="mt-3 space-y-2">
          {riskFactors.length === 0 ? (
            <div className="text-xs text-[#7E7972] p-2 italic">No anomalous risk vectors detected.</div>
          ) : (
            riskFactors.map((factor, idx) => (
              <div
                key={idx}
                className="panel-dossier-subtle rounded p-2.5 text-xs flex items-start gap-2.5"
              >
                <div
                  className={`h-1.5 w-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    factor.severity === 'high'
                      ? 'bg-[#8C3B3B]'
                      : factor.severity === 'medium'
                      ? 'bg-[#B8935F]'
                      : 'bg-[#3B6B54]'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[#EDE8DE] font-medium truncate">{factor.title}</span>
                    <span className="text-[10px] text-[#B8935F] ml-1">+{factor.impactScore}</span>
                  </div>
                  <p className="text-[11px] text-[#A8A399] mt-0.5 leading-relaxed">
                    {factor.description}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Identified Exchange Dossier */}
      <div className="p-5 border-b border-[#2A272D] flex-1 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-medium text-[#B8935F] flex items-center gap-1.5">
              <Building2 className="h-3.5 w-3.5" />
              Terminal Destination
            </div>
            <h3 className="font-serif text-lg text-[#EDE8DE] font-normal">
              Exchange Off-Ramp Endpoint
            </h3>
          </div>
          <span className="inline-flex items-center gap-1 text-[11px] text-[#3B6B54] bg-[#3B6B54]/10 border border-[#3B6B54]/30 px-2 py-0.5 rounded">
            <CheckCircle2 className="h-3 w-3" /> FIU-IND Registered
          </span>
        </div>

        {/* Exchange Intelligence Card */}
        <div className="panel-dossier rounded p-4 space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-sm font-semibold text-[#EDE8DE]">{exchange.name}</div>
              <div className="text-[11px] text-[#A8A399]">{exchange.fiuRegistrationNumber}</div>
            </div>
            <span className="rounded bg-[#201D22] border border-[#2A272D] px-2 py-0.5 text-[10px] text-[#B8935F]">
              PMLA Regulated
            </span>
          </div>

          {/* Deposit UID and KYC */}
          <div className="bg-[#161418] p-2.5 rounded border border-[#2A272D] space-y-2">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#7E7972] block">Destination Deposit UID</span>
                <span className="text-xs font-semibold text-[#EDE8DE]">{exchange.depositUid}</span>
              </div>
              <button
                onClick={() => handleCopyUid(exchange.depositUid)}
                className="text-xs text-[#A8A399] hover:text-[#EDE8DE] flex items-center gap-1 bg-[#242227] px-2 py-1 rounded"
              >
                {copiedUid ? <Check className="h-3 w-3 text-[#3B6B54]" /> : <Copy className="h-3 w-3" />}
                {copiedUid ? 'Copied' : 'Copy'}
              </button>
            </div>

            <div className="border-t border-[#242227] pt-1.5 flex items-center justify-between text-xs">
              <span className="text-[#A8A399] flex items-center gap-1">
                <UserCheck className="h-3.5 w-3.5 text-[#3B6B54]" />
                KYC Profile
              </span>
              <span className="text-[#EDE8DE] font-medium">{exchange.kycStatus}</span>
            </div>

            {/* Account Holder with explicit DEMO DATA badge */}
            <div className="text-[11px] text-[#A8A399] flex justify-between items-center">
              <span className="flex items-center gap-1.5">
                <span>Account Holder</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2521] text-[#B8935F] border border-[#B8935F]/30 font-mono">
                  DEMO DATA
                </span>
              </span>
              <span className="text-[#EDE8DE] font-mono text-[10px]">{exchange.accountHolderMasked}</span>
            </div>
          </div>

          {/* Recoverable Balance Estimate with explicit DEMO DATA badge */}
          <div className="flex items-center justify-between text-xs pt-1">
            <span className="text-[#A8A399] flex items-center gap-1.5">
              <span>Est. Recoverable Assets</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#2A2521] text-[#B8935F] border border-[#B8935F]/30 font-mono">
                DEMO DATA
              </span>
            </span>
            <span className="font-semibold text-[#B8935F] text-right font-mono text-[11px]">
              {exchange.estimatedRecoverableBalance}
            </span>
          </div>

          {/* Nodal Officer Contact Details (Public Compliance Info) */}
          <div className="pt-2 border-t border-[#242227] text-xs space-y-1.5 text-[#A8A399]">
            <div className="text-[11px] font-medium text-[#EDE8DE]">Nodal Compliance Desk (Public Info):</div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Mail className="h-3.5 w-3.5 text-[#B8935F]" />
              <span className="text-[#EDE8DE]">{exchange.nodalEmail}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px]">
              <Phone className="h-3.5 w-3.5 text-[#B8935F]" />
              <span>{exchange.nodalDeskPhone}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Sample Directive Actions Suite (Prototype Framing) */}
      <div className="p-5 space-y-2.5 bg-[#141215]">
        <div className="text-[11px] font-medium text-[#A8A399] mb-1">
          Sample Directive Actions (Prototype)
        </div>

        {/* PRIMARY CTA: Section 91 Notice */}
        <button
          id="draft-sec91-notice-action-btn"
          onClick={onOpenNotice}
          className="w-full rounded bg-[#B8935F] py-2.5 px-4 text-xs font-semibold text-[#131114] hover:bg-[#CFAC78] transition-all flex items-center justify-center gap-2 shadow-md"
        >
          <FileText className="h-4 w-4" />
          Generate Sample Freeze Directive (Prototype)
        </button>

        {/* Secondary Action: Export Briefing */}
        <button
          id="export-briefing-action-btn"
          onClick={onOpenExport}
          className="w-full rounded border border-[#2E2B32] bg-[#1C1A1E] py-2 px-3 text-xs text-[#EDE8DE] hover:border-[#B8935F]/40 hover:bg-[#242227] transition-colors flex items-center justify-center gap-1.5"
        >
          <Download className="h-3.5 w-3.5 text-[#B8935F]" />
          Export Intelligence Brief
        </button>

        {/* Tertiary Action: NCRP Simulation */}
        <button
          id="ncrp-sync-action-btn"
          onClick={handleSyncRegistry}
          className="w-full rounded border border-[#2E2B32] bg-[#1C1A1E] py-2 px-3 text-xs text-[#A8A399] hover:text-[#EDE8DE] hover:border-[#2E2B32] transition-colors flex items-center justify-center gap-1.5"
        >
          {registrySynced ? (
            <>
              <Check className="h-3.5 w-3.5 text-[#3B6B54]" />
              <span className="text-[#3B6B54]">Simulation Logged (NCRP 1930)</span>
            </>
          ) : (
            <>
              <Send className="h-3.5 w-3.5 text-[#B8935F]" />
              <span>Simulate Flag in NCRP 1930 Portal</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
