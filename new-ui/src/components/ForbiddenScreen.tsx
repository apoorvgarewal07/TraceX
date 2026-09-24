import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface ForbiddenScreenProps {
  requiredRoles?: string[];
  message?: string;
}

export function ForbiddenScreen({ requiredRoles, message }: ForbiddenScreenProps) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md rounded-xl border border-[#522329] bg-[#1C1316] p-8 text-center shadow-2xl">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#E24A4A]/40 bg-[#2D161B] text-[#E24A4A]">
          <ShieldAlert className="h-7 w-7" />
        </div>

        <h2 className="text-xl font-bold text-[#E24A4A] tracking-wide mb-1">
          403 — Clearance Denied
        </h2>
        <p className="text-xs text-[#A8A399] uppercase tracking-wider mb-4">
          Statutory Authorization Boundary
        </p>

        <p className="text-xs text-[#EDE8DE] leading-relaxed mb-6">
          {message ||
            'Your current credentials lack the clearance level required to access this case file or operational directive.'}
        </p>

        {user && (
          <div className="mb-6 rounded-lg border border-[#3E1E24] bg-[#241519] p-3 text-left text-xs space-y-1.5">
            <div className="flex justify-between text-[#A8A399]">
              <span>Active Officer:</span>
              <span className="text-[#EDE8DE] font-medium">{user.fullName || user.username}</span>
            </div>
            <div className="flex justify-between text-[#A8A399]">
              <span>Assigned Role:</span>
              <span className="text-[#B8935F] font-semibold">{user.role}</span>
            </div>
            {requiredRoles && requiredRoles.length > 0 && (
              <div className="flex justify-between text-[#A8A399] pt-1 border-t border-[#3E1E24]">
                <span>Required Clearance:</span>
                <span className="text-[#E24A4A] font-semibold">{requiredRoles.join(' or ')}</span>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2.5">
          <Link
            to="/"
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#3E3A42] bg-[#221F25] px-4 py-2 text-xs font-medium text-[#EDE8DE] hover:bg-[#2C2830] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Return to Case List</span>
          </Link>
          <button
            type="button"
            onClick={() => logout()}
            className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-[#522329] bg-[#2E151A] px-4 py-2 text-xs font-medium text-[#E24A4A] hover:bg-[#3D1A20] transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
}
