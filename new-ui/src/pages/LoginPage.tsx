import React from 'react';
import { Link } from 'react-router-dom';

export function LoginPage() {
  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md p-6 rounded-lg border border-[#2A272D] bg-[#161418] text-center shadow-lg">
        <h1 className="text-xl font-bold text-[#EDE8DE] mb-2">LoginPage</h1>
        <p className="text-sm text-[#A8A399] mb-4">Investigator authentication portal (T3 stub).</p>
        <Link to="/" className="text-xs text-[#B8935F] hover:underline">
          &larr; Back to CaseListPage (/)
        </Link>
      </div>
    </div>
  );
}
