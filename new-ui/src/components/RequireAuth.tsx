import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface RequireAuthProps {
  children: React.ReactNode;
}

/**
 * RequireAuth is a UX convenience guard that routes unauthenticated users
 * to /login with target route preservation.
 * NOTE: This is a frontend presentation guard only; the actual security
 * boundary is enforced by backend HTTP 401/403 responses.
 */
export function RequireAuth({ children }: RequireAuthProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs text-[#A8A399]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B8935F] border-t-transparent" />
          <span>Verifying investigator session...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login preserving intended target for post-login redirect
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}
