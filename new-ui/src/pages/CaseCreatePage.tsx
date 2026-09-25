import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CaseCreateForm } from '../components/CaseCreateForm';
import { Shield, ArrowLeft } from 'lucide-react';

export function CaseCreatePage() {
  const navigate = useNavigate();

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
            <p className="text-[11px] text-[#7E7972]">New Case Dossier Registration</p>
          </div>
        </div>

        <Link
          to="/"
          className="inline-flex items-center gap-1.5 text-xs text-[#A8A399] hover:text-[#EDE8DE] bg-[#1C1A1E] px-3 py-1.5 rounded border border-[#2E2B32] transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Case Directory</span>
        </Link>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-6">
        <CaseCreateForm onCancel={() => navigate('/')} />
      </main>
    </div>
  );
}
