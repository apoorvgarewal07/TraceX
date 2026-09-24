import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { LeftPanel } from '../components/LeftPanel';
import { HeroGraph } from '../components/HeroGraph';
import { RightPanel } from '../components/RightPanel';
import { Section91NoticeModal } from '../components/Section91NoticeModal';
import { EvidenceExportModal } from '../components/EvidenceExportModal';
import { ForensicCase } from '../types';
import { FORENSIC_CASES } from '../data/cases';

interface CaseDetailPageProps {
  currentCase?: ForensicCase | null;
  activeHop?: number;
  setActiveHop?: (hop: number) => void;
  isTracing?: boolean;
  setIsTracing?: (val: boolean) => void;
  traceStatus?: 'idle' | 'connecting' | 'connected' | 'completed' | 'failed' | 'disconnected';
  traceProgress?: number;
  latestHop?: any;
  isExecuting?: boolean;
  onPinNode?: (addr: string) => void;
  onSelectCase?: (c: ForensicCase) => void;
  onExecuteTrace?: (addr: string, chain: string, complaintId?: string) => void;
  onResetTrace?: () => void;
  isNoticeModalOpen?: boolean;
  setIsNoticeModalOpen?: (open: boolean) => void;
  isExportModalOpen?: boolean;
  setIsExportModalOpen?: (open: boolean) => void;
  onNavigateHome?: () => void;
}

export function CaseDetailPage(props: CaseDetailPageProps) {
  const { caseId } = useParams<{ caseId: string }>();

  // If active case is loaded into dashboard props, render the full investigative workspace
  if (props.currentCase) {
    return (
      <div className="flex h-screen flex-col bg-[#131114] text-[#EDE8DE] overflow-hidden select-none">
        <Header
          currentCase={props.currentCase}
          onOpenNotice={() => props.setIsNoticeModalOpen?.(true)}
          onOpenExport={() => props.setIsExportModalOpen?.(true)}
          onNavigateHome={props.onNavigateHome || (() => {})}
        />
        <main className="flex flex-1 flex-col lg:flex-row overflow-hidden">
          <LeftPanel
            currentCase={props.currentCase}
            isExecuting={props.isExecuting || false}
            onSelectCase={props.onSelectCase || (() => {})}
            onExecuteTrace={props.onExecuteTrace || (() => {})}
            onResetTrace={props.onResetTrace || (() => {})}
          />
          <HeroGraph
            currentCase={props.currentCase}
            onOpenNotice={() => props.setIsNoticeModalOpen?.(true)}
            activeHop={props.activeHop || 0}
            setActiveHop={props.setActiveHop || (() => {})}
            isTracing={props.isTracing || false}
            setIsTracing={props.setIsTracing || (() => {})}
            traceStatus={props.traceStatus || 'idle'}
            traceProgress={props.traceProgress || 0}
            latestHop={props.latestHop}
            isExecuting={props.isExecuting || false}
            onPinNode={props.onPinNode || (() => {})}
            onSelectDefaultCase={props.onSelectCase ? () => props.onSelectCase?.(FORENSIC_CASES[0]) : undefined}
          />
          <RightPanel
            currentCase={props.currentCase}
            activeHop={props.activeHop || 0}
            onOpenNotice={() => props.setIsNoticeModalOpen?.(true)}
            onOpenExport={() => props.setIsExportModalOpen?.(true)}
          />
        </main>
        {props.isNoticeModalOpen && (
          <Section91NoticeModal
            isOpen={props.isNoticeModalOpen}
            onClose={() => props.setIsNoticeModalOpen?.(false)}
            currentCase={props.currentCase}
          />
        )}
        {props.isExportModalOpen && (
          <EvidenceExportModal
            isOpen={props.isExportModalOpen}
            onClose={() => props.setIsExportModalOpen?.(false)}
            currentCase={props.currentCase}
          />
        )}
      </div>
    );
  }

  // Pure stub display when accessed directly via /cases/:caseId without a preloaded state
  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg p-6 rounded-lg border border-[#2A272D] bg-[#161418] text-center shadow-lg">
        <h1 className="text-xl font-bold text-[#EDE8DE] mb-2">CaseDetailPage</h1>
        <p className="text-sm text-[#A8A399] mb-4">
          Case Workspace for dossier ID: <code className="text-[#B8935F]">{caseId || 'unspecified'}</code> (T2/T5 stub).
        </p>
        <Link to="/" className="text-xs text-[#B8935F] hover:underline">
          &larr; Back to CaseListPage (/)
        </Link>
      </div>
    </div>
  );
}
