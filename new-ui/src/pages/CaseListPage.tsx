import React from 'react';
import { Link } from 'react-router-dom';
import { HomeScreen } from '../components/HomeScreen';
import { ForensicCase } from '../types';

interface CaseListPageProps {
  onExecuteTrace?: (address: string, chain: string, complaintId?: string) => void;
  onSelectCase?: (c: ForensicCase) => void;
  hasActiveSession?: boolean;
  activeCase?: ForensicCase | null;
  onReturnToDashboard?: () => void;
}

export function CaseListPage({
  onExecuteTrace,
  onSelectCase,
  hasActiveSession,
  activeCase,
  onReturnToDashboard,
}: CaseListPageProps) {
  return (
    <div className="flex flex-col min-h-screen bg-[#131114]">
      {/* Route banner for scaffold navigation testing */}
      <div className="border-b border-[#2A272D] bg-[#161418] px-6 py-2 text-xs text-[#A8A399] flex flex-wrap items-center justify-between gap-2 z-30">
        <div>
          <span className="font-semibold text-[#EDE8DE]">CaseListPage</span> — Route: <code className="text-[#B8935F]">/</code>
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#7E7972]">Scaffold Routes:</span>
          <Link to="/login" className="text-[#B8935F] hover:underline">/login</Link>
          <Link to="/cases/new" className="text-[#B8935F] hover:underline">/cases/new</Link>
          <Link to="/cases/case-euler-exploit" className="text-[#B8935F] hover:underline">/cases/:caseId</Link>
          <Link to="/unauthorized" className="text-[#B8935F] hover:underline">/unauthorized</Link>
        </div>
      </div>

      {/* Primary Landing Screen */}
      {onExecuteTrace && onSelectCase ? (
        <HomeScreen
          onExecuteTrace={onExecuteTrace}
          onSelectCase={onSelectCase}
          hasActiveSession={hasActiveSession}
          activeCase={activeCase || undefined}
          onReturnToDashboard={onReturnToDashboard}
        />
      ) : (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="max-w-md p-6 rounded-lg border border-[#2A272D] bg-[#161418] text-center">
            <h1 className="text-xl font-bold text-[#EDE8DE] mb-2">CaseListPage</h1>
            <p className="text-sm text-[#A8A399]">Investigative case repository and search portal (T2/T5 stub).</p>
          </div>
        </div>
      )}
    </div>
  );
}
