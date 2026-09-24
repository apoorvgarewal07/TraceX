// ============================================================================
// TEMPORARY STUB — remove when POST /api/v1/auth/login is confirmed live.
// See T3 in execution package.
// Simulates backend httpOnly session authentication across standard roles:
// - INVESTIGATOR (investigator / testpass)
// - SUPERVISOR (supervisor / testpass)
// - ADMIN (admin / testpass)
// Session identifier is kept in a browser session cookie (not localStorage/sessionStorage).
// ============================================================================

export type UserRole = 'INVESTIGATOR' | 'SUPERVISOR' | 'ADMIN';

export interface User {
  id: string;
  username: string;
  role: UserRole;
  fullName: string;
  badgeNumber: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

const STUB_USERS: Record<string, { user: User; pass: string }> = {
  investigator: {
    pass: 'testpass',
    user: {
      id: 'usr-inv-001',
      username: 'investigator',
      role: 'INVESTIGATOR',
      fullName: 'Insp. Vikramaditya Sen',
      badgeNumber: 'I4C-DEL-7712',
    },
  },
  supervisor: {
    pass: 'testpass',
    user: {
      id: 'usr-sup-001',
      username: 'supervisor',
      role: 'SUPERVISOR',
      fullName: 'SP Rajeshwar Rao',
      badgeNumber: 'I4C-DEL-4001',
    },
  },
  admin: {
    pass: 'testpass',
    user: {
      id: 'usr-adm-001',
      username: 'admin',
      role: 'ADMIN',
      fullName: 'Director S. Ramanathan',
      badgeNumber: 'I4C-HQ-0001',
    },
  },
};

const COOKIE_NAME = 'tracex_stub_session';

function getSessionCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(^| )' + COOKIE_NAME + '=([^;]+)'));
  return match ? decodeURIComponent(match[2]) : null;
}

function setSessionCookie(username: string): void {
  if (typeof document === 'undefined') return;
  // Session cookie (cleared when browser closes)
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(username)}; path=/; SameSite=Strict`;
}

function clearSessionCookie(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${COOKIE_NAME}=; path=/; max-age=0; SameSite=Strict`;
}

export const authStub = {
  async login(payload: LoginPayload): Promise<User> {
    // Artificial network delay
    await new Promise((r) => setTimeout(r, 180));

    const record = STUB_USERS[payload.username.trim().toLowerCase()];
    if (!record || record.pass !== payload.password) {
      const error: any = new Error('Invalid investigator credentials');
      error.response = { status: 401, data: { detail: 'Invalid investigator credentials' } };
      throw error;
    }

    setSessionCookie(record.user.username);
    return record.user;
  },

  async me(): Promise<User> {
    await new Promise((r) => setTimeout(r, 100));

    const activeUser = getSessionCookie();
    if (!activeUser || !STUB_USERS[activeUser]) {
      const error: any = new Error('No active session');
      error.response = { status: 401, data: { detail: 'Session expired or not found' } };
      throw error;
    }

    return STUB_USERS[activeUser].user;
  },

  async logout(): Promise<void> {
    await new Promise((r) => setTimeout(r, 80));
    clearSessionCookie();
  },
};
