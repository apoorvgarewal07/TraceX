import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { LeftPanel } from '../components/LeftPanel';
import { HeroGraph } from '../components/HeroGraph';
import { RightPanel } from '../components/RightPanel';
import { FindingsDrawer } from '../components/FindingsDrawer';
import { Section91NoticeModal } from '../components/Section91NoticeModal';
import { EvidenceExportModal } from '../components/EvidenceExportModal';
import { ForensicCase } from '../types';
import { FORENSIC_CASES } from '../data/cases';
import { ShieldAlert, AlertTriangle, ArrowLeft } from 'lucide-react';

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
  const [highlightedEdgeIds, setHighlightedEdgeIds] = useState<string[]>([]);
  const [activeRightTab, setActiveRightTab] = useState<'assessment' | 'findings'>('findings');

  const traceId = props.currentCase?.id || caseId || 'trace-sample-001';

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
            highlightedEdgeIds={highlightedEdgeIds}
          />

          {/* Right Workspace Sidebar: Threat Assessment vs Intelligence Findings */}
          <div className="w-full lg:w-80 xl:w-96 flex-shrink-0 flex flex-col border-t lg:border-t-0 lg:border-l border-[#2A272D] bg-[#161418] overflow-hidden">
            {/* View Switcher Tabs */}
            <div className="flex border-b border-[#2A272D] bg-[#141215] text-xs">
              <button
                type="button"
                onClick={() => setActiveRightTab('findings')}
                className={`flex-1 py-2.5 px-3 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'findings'
                    ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                    : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-[#B8935F]" />
                <span>Findings (R1–R8)</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('assessment')}
                className={`flex-1 py-2.5 px-3 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1.5 ${
                  activeRightTab === 'assessment'
                    ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                    : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-[#B8935F]" />
                <span>Threat Assessment</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-hidden">
              {activeRightTab === 'findings' ? (
                <FindingsDrawer
                  traceId={traceId}
                  highlightedEdgeIds={highlightedEdgeIds}
                  onHighlightEdges={setHighlightedEdgeIds}
                  className="h-full border-l-0"
                />
              ) : (
                <RightPanel
                  currentCase={props.currentCase}
                  activeHop={props.activeHop || 0}
                  onOpenNotice={() => props.setIsNoticeModalOpen?.(true)}
                  onOpenExport={() => props.setIsExportModalOpen?.(true)}
                />
              )}
            </div>
          </div>
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
      <div className="w-full max-w-xl p-6 rounded-lg border border-[#2A272D] bg-[#161418] text-center shadow-lg">
        <h1 className="text-xl font-bold text-[#EDE8DE] mb-2">Case Workspace</h1>
        <p className="text-sm text-[#A8A399] mb-4">
          Case Workspace for dossier ID: <code className="text-[#B8935F]">{caseId || 'unspecified'}</code>.
        </p>

        {props.onSelectCase && (
          <button
            type="button"
            onClick={() => props.onSelectCase?.(FORENSIC_CASES[0])}
            className="mb-4 inline-flex items-center gap-2 px-4 py-2 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78] transition-colors"
          >
            Load Sample Forensic Dossier
          </button>
        )}

        {/* Embedded Findings Preview for Direct Navigation */}
        <div className="mt-4 text-left border border-[#2A272D] rounded-lg overflow-hidden h-96">
          <FindingsDrawer
            traceId={caseId || 'trace-sample-001'}
            highlightedEdgeIds={highlightedEdgeIds}
            onHighlightEdges={setHighlightedEdgeIds}
            className="h-full border-l-0"
          />
        </div>

        <div className="mt-4">
          <Link to="/" className="text-xs text-[#B8935F] hover:underline inline-flex items-center gap-1">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Case Directory (/)
          </Link>
        </div>
      </div>
    </div>
  );
}
