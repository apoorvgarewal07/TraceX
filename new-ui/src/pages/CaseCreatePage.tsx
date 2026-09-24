import React from 'react';
import { Link } from 'react-router-dom';

export function CaseCreatePage() {
  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg p-6 rounded-lg border border-[#2A272D] bg-[#161418] text-center shadow-lg">
        <h1 className="text-xl font-bold text-[#EDE8DE] mb-2">CaseCreatePage</h1>
        <p className="text-sm text-[#A8A399] mb-4">New case dossier and fraud incident registration (T2/T5 stub).</p>
        <Link to="/" className="text-xs text-[#B8935F] hover:underline">
          &larr; Back to CaseListPage (/)
        </Link>
      </div>
    </div>
  );
}
