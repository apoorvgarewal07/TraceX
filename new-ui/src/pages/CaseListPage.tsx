import React from 'react';
import { Link } from 'react-router-dom';
import { HomeScreen } from '../components/HomeScreen';
import { ForensicCase } from '../types';
import { useAuth } from '../hooks/useAuth';

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
  const { user, logout, loading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#131114]">
      {/* Route & Session banner */}
      <div className="border-b border-[#2A272D] bg-[#161418] px-6 py-2 text-xs text-[#A8A399] flex flex-wrap items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-[#EDE8DE]">CaseListPage</span>
          <span className="text-[#7E7972]">|</span>
          {loading ? (
            <span className="text-[#7E7972]">Checking session...</span>
          ) : user ? (
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#B8935F]/20 text-[#B8935F] border border-[#B8935F]/40">
                {user.role}
              </span>
              <span className="text-[#EDE8DE] font-medium">{user.fullName || user.username}</span>
              <button
                type="button"
                onClick={() => logout()}
                className="ml-2 text-xs text-[#E24A4A] hover:underline cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <Link to="/login" className="text-[#B8935F] hover:underline font-medium">
              Sign In &rarr;
            </Link>
          )}
        </div>
        <div className="flex items-center gap-4 text-xs">
          <span className="text-[#7E7972]">Routes:</span>
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
