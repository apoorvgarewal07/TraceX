import { Shield, FileText, Download, CheckCircle2, Clock, Plus } from 'lucide-react';
import { ForensicCase } from '../types';

interface HeaderProps {
  currentCase: ForensicCase;
  onOpenNotice: () => void;
  onOpenExport: () => void;
  onNavigateHome?: () => void;
}

export function Header({
  currentCase,
  onOpenNotice,
  onOpenExport,
  onNavigateHome,
}: HeaderProps) {
  return (
    <header className="border-b border-[#2A272D] bg-[#161418] px-6 py-3">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Left: Agency & Project Title */}
        <div className="flex items-center gap-4">
          <div
            className={`flex items-center gap-3 ${onNavigateHome ? 'cursor-pointer group' : ''}`}
            onClick={onNavigateHome}
            title={onNavigateHome ? 'Return to Home / Landing screen' : undefined}
          >
            <div className="flex h-9 w-9 items-center justify-center rounded border border-[#B8935F]/40 bg-[#1C1A1E] text-[#B8935F] group-hover:border-[#B8935F] transition-colors">
              <Shield className="h-5 w-5" strokeWidth={1.75} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg tracking-normal font-semibold text-[#EDE8DE] group-hover:text-[#B8935F] transition-colors">
                  TraceX
                </span>
                <span className="text-[11px] font-normal text-[#A8A399] tracking-normal border-l border-[#2E2B32] pl-2">
                  I4C Cyber Forensics Desk
                </span>
              </div>
              <p className="text-[11px] text-[#7E7972] leading-none">
                Ministry of Home Affairs, Government of India
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-2 border-l border-[#2E2B32] pl-4">
            <span className="inline-flex items-center gap-1.5 rounded bg-[#1C1A1E] px-2.5 py-1 text-xs text-[#EDE8DE] border border-[#2E2B32]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#B8935F]"></span>
              Case File: {currentCase.ncrpDocketNumber}
            </span>
            <span className="text-xs text-[#A8A399]">
              {currentCase.firNumber}
            </span>
          </div>
        </div>

        {/* Center/Right: Intelligence Status & Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden lg:flex items-center gap-3 text-xs text-[#A8A399] border-r border-[#2E2B32] pr-4">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5 text-[#B8935F]" />
              <span>Evidence Timestamp: {currentCase.reportingDate}</span>
            </div>
            <span className="inline-flex items-center gap-1 text-[#3B6B54] bg-[#3B6B54]/10 border border-[#3B6B54]/30 px-2 py-0.5 rounded text-[11px]">
              <CheckCircle2 className="h-3 w-3" /> Chain Verified
            </span>
          </div>

          {onNavigateHome && (
            <button
              onClick={onNavigateHome}
              className="inline-flex items-center gap-1.5 rounded border border-[#2E2B32] bg-[#1C1A1E] px-2.5 py-1.5 text-xs text-[#A8A399] hover:text-[#EDE8DE] hover:border-[#B8935F]/40 transition-colors"
              title="Start a new investigation on home screen"
            >
              <Plus className="h-3.5 w-3.5 text-[#B8935F]" />
              <span>New Case</span>
            </button>
          )}

          <button
            id="export-evidence-brief-btn"
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 rounded border border-[#2E2B32] bg-[#1C1A1E] px-3 py-1.5 text-xs text-[#EDE8DE] hover:border-[#B8935F]/40 hover:text-[#EDE8DE] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#B8935F]" />
            Evidence Brief
          </button>

          <button
            id="draft-freeze-notice-header-btn"
            onClick={onOpenNotice}
            className="inline-flex items-center gap-1.5 rounded bg-[#B8935F] px-3.5 py-1.5 text-xs font-medium text-[#131114] hover:bg-[#CFAC78] transition-colors shadow-sm"
          >
            <FileText className="h-3.5 w-3.5" />
            Draft Sec. 91 Notice
          </button>
        </div>
      </div>
    </header>
  );
}
