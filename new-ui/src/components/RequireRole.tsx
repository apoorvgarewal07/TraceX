import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserRole } from '../api/client';
import { ForbiddenScreen } from './ForbiddenScreen';

interface RequireRoleProps {
  roles: UserRole[];
  children: React.ReactNode;
}

/**
 * RequireRole is a UX convenience component that renders ForbiddenScreen in-place
 * when the authenticated user's role does not match the required list.
 * NOTE: This is a frontend presentation guard only; the actual security
 * boundary is enforced by backend HTTP 403 responses.
 */
export function RequireRole({ roles, children }: RequireRoleProps) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#131114] text-[#EDE8DE] flex items-center justify-center">
        <div className="flex items-center gap-3 text-xs text-[#A8A399]">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#B8935F] border-t-transparent" />
          <span>Verifying clearance level...</span>
        </div>
      </div>
    );
  }

  if (!user || !roles.includes(user.role)) {
    return (
      <ForbiddenScreen
        requiredRoles={roles}
        message={`Access restricted: This view or action requires ${roles.join(' or ')} clearance.`}
      />
    );
  }

  return <>{children}</>;
}
