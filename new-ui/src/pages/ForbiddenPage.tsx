import React from 'react';
import { Link } from 'react-router-dom';

export function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-6 rounded-lg border border-[#3A1E24] bg-[#1C1316] text-center shadow-lg">
        <h1 className="text-xl font-bold text-[#E24A4A] mb-2">ForbiddenPage</h1>
        <p className="text-sm text-[#A8A399] mb-4">Access restricted: insufficient role clearance (T2/T4 stub).</p>
        <Link to="/" className="text-xs text-[#B8935F] hover:underline">
          &larr; Back to CaseListPage (/)
        </Link>
      </div>
    </div>
  );
}
