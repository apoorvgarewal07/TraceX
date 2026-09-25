import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { LeftPanel } from '../components/LeftPanel';
import { HeroGraph } from '../components/HeroGraph';
import { RightPanel } from '../components/RightPanel';
import { FindingsDrawer } from '../components/FindingsDrawer';
import { CopilotChat } from '../components/CopilotChat';
import { ExitCard } from '../components/ExitCard';
import { GasParentClusterView } from '../components/GasParentClusterView';
import { CrossComplaintView } from '../components/CrossComplaintView';
import { DataModeBanner } from '../components/DataModeBanner';
import { FraudTxPicker } from '../components/FraudTxPicker';
import { Section91NoticeModal } from '../components/Section91NoticeModal';
import { EvidenceExportModal } from '../components/EvidenceExportModal';
import { ForensicCase } from '../types';
import { FORENSIC_CASES } from '../data/cases';
import { useCaseDetail } from '../hooks/useCase';
import { getExits, ExitDetail } from '../api/client';
import {
  ShieldAlert,
  AlertTriangle,
  ArrowLeft,
  Loader2,
  FolderOpen,
  Network,
  Bot,
  FileCheck,
  Building2,
  CheckCircle2,
  Radio,
  Flame,
  GitFork,
} from 'lucide-react';

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
  const [activeRightTab, setActiveRightTab] = useState<'findings' | 'copilot' | 'assessment'>('findings');
  const [activeTab, setActiveTab] = useState<'findings' | 'graph' | 'copilot' | 'clusters' | 'evidence'>('findings');
  const [activeClusterSubTab, setActiveClusterSubTab] = useState<'exits' | 'gas_parents' | 'cross_complaint'>('exits');
  const [exits, setExits] = useState<ExitDetail[]>([]);
  const [exitsLoading, setExitsLoading] = useState(false);

  const { caseData, loading: caseLoading, error: caseError, launchTrace, isTracing: isCaseTracing } = useCaseDetail(caseId);

  const activeDataMode = caseData?.data_mode || 'LIVE';
  const traceId = props.currentCase?.id || caseData?.active_trace_id || caseId || 'trace-sample-001';

  React.useEffect(() => {
    let mounted = true;
    async function fetchExits() {
      try {
        setExitsLoading(true);
        const data = await getExits(caseId || traceId);
        if (mounted) setExits(data);
      } catch (err) {
        console.error('Failed to load exits:', err);
      } finally {
        if (mounted) setExitsLoading(false);
      }
    }
    fetchExits();
    return () => {
      mounted = false;
    };
  }, [caseId, traceId]);

  const handleLaunchTrace = async (fraudTxHash: string) => {
    if (caseId) {
      await launchTrace({ fraud_tx_hash: fraudTxHash, chain: caseData?.chain || 'ETH' });
    }
  };

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

        {/* Prominent Data Mode Banner */}
        <DataModeBanner dataMode={activeDataMode} />

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
                className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  activeRightTab === 'findings'
                    ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                    : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                }`}
              >
                <ShieldAlert className="h-3.5 w-3.5 text-[#B8935F]" />
                <span>Findings</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('copilot')}
                className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  activeRightTab === 'copilot'
                    ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                    : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                }`}
              >
                <Bot className="h-3.5 w-3.5 text-[#B8935F]" />
                <span>Copilot</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveRightTab('assessment')}
                className={`flex-1 py-2.5 px-2 text-center font-medium border-b-2 transition-colors flex items-center justify-center gap-1 ${
                  activeRightTab === 'assessment'
                    ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                    : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                }`}
              >
                <AlertTriangle className="h-3.5 w-3.5 text-[#B8935F]" />
                <span>Threat</span>
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
              ) : activeRightTab === 'copilot' ? (
                <CopilotChat
                  caseId={caseId || props.currentCase.id}
                  traceId={traceId}
                  onHighlightEdges={setHighlightedEdgeIds}
                  className="h-full border-0 rounded-none"
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

  // Standalone Case Workspace Shell for /cases/:caseId route
  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col">
      {/* Top Header */}
      <header className="border-b border-[#2A272D] bg-[#161418] px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <Link
            to="/"
            className="p-1.5 rounded text-[#A8A399] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors"
            title="Return to Case Directory"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-sm tracking-wide text-[#EDE8DE]">
                CASE DOSSIER: {caseData?.complaint_ref || caseId}
              </span>
              <span className="text-[10px] font-mono text-[#B8935F] bg-[#1C1A1E] px-1.5 py-0.5 rounded border border-[#2E2B32]">
                {caseData?.complaint_source || 'NCRP'}
              </span>
            </div>
            <p className="text-[11px] text-[#7E7972] font-mono">ID: {caseId || 'unspecified'}</p>
          </div>
        </div>

        {caseData && (
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-[11px] px-2 py-0.5 rounded border bg-[#242227] border-[#2E2B32] text-[#A8A399]">
              {caseData.chain} Ledger
            </span>
            <span className="font-mono text-[11px] px-2 py-0.5 rounded border bg-[#3B6B54]/20 border-[#3B6B54]/40 text-[#34D399]">
              {caseData.status}
            </span>
          </div>
        )}
      </header>

      {/* Prominent Data Mode Banner */}
      <DataModeBanner dataMode={activeDataMode} />

      {/* Main Workspace Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-6 space-y-6">
        {caseLoading && (
          <div className="p-12 text-center text-[#A8A399] flex flex-col items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
            <p className="text-xs">Loading case dossier metadata...</p>
          </div>
        )}

        {caseError && (
          <div className="p-4 rounded-lg bg-[#8C3B3B]/15 border border-[#8C3B3B]/40 text-xs text-[#E05A47]">
            <p className="font-medium">Case Access Notice</p>
            <p className="text-[11px] text-[#A8A399] mt-0.5">{caseError}</p>
          </div>
        )}

        {/* Fraud Transaction Picker Shell */}
        <FraudTxPicker
          caseId={caseId || 'unspecified'}
          initialHash={caseData?.fraud_tx_hash || ''}
          chain={caseData?.chain || 'ETH'}
          isTracing={isCaseTracing}
          onSubmitTrace={handleLaunchTrace}
        />

        {/* Workspace Feature Tabs Header */}
        <div className="border-b border-[#2A272D] flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('findings')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'findings'
                ? 'border-[#B8935F] text-[#EDE8DE] bg-[#18161A]'
                : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
            }`}
          >
            <ShieldAlert className="h-4 w-4 text-[#B8935F]" />
            <span>Deterministic Findings (T7)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('graph')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'graph'
                ? 'border-[#B8935F] text-[#EDE8DE] bg-[#18161A]'
                : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
            }`}
          >
            <Network className="h-4 w-4 text-[#A8A399]" />
            <span>Attribution Graph</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('copilot')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'copilot'
                ? 'border-[#B8935F] text-[#EDE8DE] bg-[#18161A]'
                : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
            }`}
          >
            <Bot className="h-4 w-4 text-[#A8A399]" />
            <span>Grounded Copilot (T9)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('clusters')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'clusters'
                ? 'border-[#B8935F] text-[#EDE8DE] bg-[#18161A]'
                : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
            }`}
          >
            <Building2 className="h-4 w-4 text-[#A8A399]" />
            <span>Exits & Clusters (T10)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('evidence')}
            className={`py-2.5 px-4 font-medium border-b-2 transition-colors flex items-center gap-2 ${
              activeTab === 'evidence'
                ? 'border-[#B8935F] text-[#EDE8DE] bg-[#18161A]'
                : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
            }`}
          >
            <FileCheck className="h-4 w-4 text-[#A8A399]" />
            <span>Legal Export & Sec 91 (T11)</span>
          </button>
        </div>

        {/* Tab Viewport */}
        <div className="bg-[#161418] border border-[#2A272D] rounded-xl overflow-hidden min-h-[420px]">
          {activeTab === 'findings' && (
            <FindingsDrawer
              traceId={traceId}
              highlightedEdgeIds={highlightedEdgeIds}
              onHighlightEdges={setHighlightedEdgeIds}
              className="h-[460px] border-l-0"
            />
          )}

          {activeTab === 'graph' && (
            <div className="p-8 text-center text-[#A8A399] flex flex-col items-center justify-center space-y-4">
              <Network className="h-10 w-10 text-[#B8935F]" />
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-[#EDE8DE]">Interactive Attribution Graph</h3>
                <p className="text-xs text-[#7E7972] mt-1">
                  Launch a trace using the fraud-transaction picker above, or open the sample Euler benchmark to explore live graph traversal.
                </p>
              </div>
              {props.onSelectCase && (
                <button
                  type="button"
                  onClick={() => props.onSelectCase?.(FORENSIC_CASES[0])}
                  className="px-4 py-2 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78]"
                >
                  Load Benchmark Graph View
                </button>
              )}
            </div>
          )}

          {activeTab === 'copilot' && (
            <CopilotChat
              caseId={caseId || traceId}
              traceId={traceId}
              onHighlightEdges={setHighlightedEdgeIds}
              className="h-[520px] border-0 rounded-none"
            />
          )}

          {activeTab === 'clusters' && (
            <div className="p-6 space-y-6">
              {/* Sub-tab navigation bar */}
              <div className="flex border-b border-[#2A272D] gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setActiveClusterSubTab('exits')}
                  className={`py-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeClusterSubTab === 'exits'
                      ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                      : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                  }`}
                >
                  <Building2 className="h-3.5 w-3.5 text-[#B8935F]" />
                  <span>Exchange Exits ({exits.length})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveClusterSubTab('gas_parents')}
                  className={`py-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeClusterSubTab === 'gas_parents'
                      ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                      : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                  }`}
                >
                  <Flame className="h-3.5 w-3.5 text-[#B8935F]" />
                  <span>Gas-Parent Clusters</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveClusterSubTab('cross_complaint')}
                  className={`py-2 px-3 font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                    activeClusterSubTab === 'cross_complaint'
                      ? 'border-[#B8935F] text-[#EDE8DE] bg-[#1C1A1E]'
                      : 'border-transparent text-[#7E7972] hover:text-[#EDE8DE]'
                  }`}
                >
                  <GitFork className="h-3.5 w-3.5 text-[#B8935F]" />
                  <span>Cross-Complaint Matches</span>
                </button>
              </div>

              {/* Sub-tab Viewports */}
              {activeClusterSubTab === 'exits' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#2A272D]">
                    <div>
                      <h3 className="text-xs font-semibold text-[#EDE8DE] uppercase tracking-wider font-mono">
                        VASP Exit Attribution ({exits.length})
                      </h3>
                      <p className="text-[10px] text-[#7E7972]">
                        Centralized exchanges and off-ramp liquidity pools identified as fund termination points
                      </p>
                    </div>
                  </div>

                  {exitsLoading ? (
                    <div className="p-12 text-center text-[#A8A399] flex flex-col items-center justify-center">
                      <Loader2 className="h-6 w-6 animate-spin text-[#B8935F] mb-2" />
                      <p className="text-xs">Analyzing identified exchange exits...</p>
                    </div>
                  ) : exits.length === 0 ? (
                    <div className="p-8 text-center text-[#7E7972] border border-[#2A272D] rounded-xl bg-[#141215]">
                      <Building2 className="h-8 w-8 mx-auto text-[#7E7972] mb-2 opacity-50" />
                      <p className="text-xs font-medium">No exchange exits identified for this trace.</p>
                      <p className="text-[11px] text-[#5A5650] mt-0.5">
                        Funds remain within non-custodial intermediary addresses or unmapped endpoints.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {exits.map((exit) => (
                        <ExitCard
                          key={exit.exit_id}
                          exit={exit}
                          onHighlightWallet={(w) => setHighlightedEdgeIds([w])}
                          onHighlightEdges={setHighlightedEdgeIds}
                          onOpenNotice={() => props.setIsNoticeModalOpen?.(true)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeClusterSubTab === 'gas_parents' && (
                <GasParentClusterView
                  caseId={caseId || traceId}
                  onHighlightEdges={setHighlightedEdgeIds}
                />
              )}

              {activeClusterSubTab === 'cross_complaint' && (
                <CrossComplaintView caseId={caseId || traceId} />
              )}
            </div>
          )}

          {activeTab === 'evidence' && (
            <div className="p-8 text-center text-[#A8A399] flex flex-col items-center justify-center space-y-3">
              <FileCheck className="h-10 w-10 text-[#B8935F]" />
              <div className="max-w-md">
                <h3 className="text-sm font-semibold text-[#EDE8DE]">Court Evidence Bundle & Notice Draft (T11 Placeholder)</h3>
                <p className="text-xs text-[#7E7972] mt-1">
                  Section 91 CrPC freeze directive generation and cryptographic SHA-256 evidence bundle export. Coming in T11.
                </p>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
