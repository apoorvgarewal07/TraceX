import React from 'react';
import { Link } from 'react-router-dom';
import { CaseList } from '../components/CaseList';
import { useAuth } from '../hooks/useAuth';
import { Shield, Plus, LogOut, User as UserIcon } from 'lucide-react';

export function CaseListPage() {
  const { user, logout, loading } = useAuth();

  return (
    <div className="flex flex-col min-h-screen bg-[#131114] text-[#EDE8DE]">
      {/* Top Header */}
      <header className="border-b border-[#2A272D] bg-[#161418] px-6 py-3 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded bg-[#B8935F]/20 border border-[#B8935F]/40 flex items-center justify-center text-[#B8935F]">
            <Shield className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif font-semibold text-sm tracking-wide text-[#EDE8DE]">
                TRACEX FORENSICS
              </span>
              <span className="text-[10px] font-mono text-[#B8935F] bg-[#1C1A1E] px-1.5 py-0.5 rounded border border-[#2E2B32]">
                I4C / MHA
              </span>
            </div>
            <p className="text-[11px] text-[#7E7972]">Law Enforcement Cryptographic Attribution Portal</p>
          </div>
        </div>

        {/* User Session Affordance */}
        <div className="flex items-center gap-3 text-xs">
          {user ? (
            <div className="flex items-center gap-3 bg-[#1C1A1E] border border-[#2A272D] px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-1.5">
                <UserIcon className="h-3.5 w-3.5 text-[#B8935F]" />
                <span className="font-medium text-[#EDE8DE]">{user.fullName || user.username}</span>
                <span className="text-[10px] font-mono font-bold bg-[#B8935F]/20 text-[#B8935F] px-1.5 py-0.2 rounded border border-[#B8935F]/30 ml-1">
                  {user.role}
                </span>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="text-[#E05A47] hover:underline flex items-center gap-1 text-[11px] border-l border-[#2E2B32] pl-2.5"
                title="Sign out of forensic session"
              >
                <LogOut className="h-3 w-3" />
                <span>Sign Out</span>
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              className="px-3 py-1.5 rounded bg-[#B8935F] text-[#131114] text-xs font-semibold hover:bg-[#CFAC78]"
            >
              Sign In
            </Link>
          )}
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 space-y-6">
        <div>
          <h1 className="font-serif text-2xl font-normal text-[#EDE8DE]">
            Authorized Case Dossiers
          </h1>
          <p className="text-xs text-[#A8A399] mt-1">
            Access assigned cryptocurrency fraud investigations, FIR/NCRP complaint dockets, and live taint traversal graphs.
          </p>
        </div>

        <CaseList />
      </main>
    </div>
  );
}
