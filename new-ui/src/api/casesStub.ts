// TEMPORARY STUB — replace when Person 1 ships /api/v1/cases/*. See T5 in execution package.
// WAIT FOR PERSON 1: /api/v1/cases/* not confirmed live

import { User } from './authStub';

export type ComplaintSource = 'NCRP' | 'SAHYOG' | 'POLICE_PORTAL';
export type CaseStatus = 'PENDING' | 'TRACING' | 'COMPLETED' | 'FLAGGED';
export type DataMode = 'LIVE' | 'CACHED' | 'UNAVAILABLE';

export interface CaseItem {
  case_id: string;
  complaint_source: ComplaintSource;
  complaint_ref: string;
  fraud_tx_hash: string;
  chain: 'ETH' | 'POLYGON' | string;
  created_at: string;
  created_by: string; // username or user id
  assigned_role: string;
  status: CaseStatus;
  active_trace_id?: string;
  data_mode: DataMode;
  target_vasp?: string;
}

export interface CreateCasePayload {
  complaint_source: ComplaintSource;
  complaint_ref: string;
  fraud_tx_hash: string;
  chain: string;
}

export interface StartCaseTracePayload {
  fraud_tx_hash: string;
  chain?: string;
  max_hops?: number;
}

// Initial cases store in memory for session
const INITIAL_CASES: CaseItem[] = [
  {
    case_id: 'case_ncrp_2026_001',
    complaint_source: 'NCRP',
    complaint_ref: 'NCRP-2026-90412',
    fraud_tx_hash: '0x4a8b79234c01f68749e7b2f0a1c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1',
    chain: 'ETH',
    created_at: '2026-09-20T10:30:00Z',
    created_by: 'investigator',
    assigned_role: 'INVESTIGATOR',
    status: 'COMPLETED',
    active_trace_id: 'trace-sample-001',
    data_mode: 'LIVE',
    target_vasp: 'Binance Holdings Ltd.',
  },
  {
    case_id: 'case_sahyog_2026_002',
    complaint_source: 'SAHYOG',
    complaint_ref: 'I4C-SYG-2026-8819',
    fraud_tx_hash: '0x8f12a34b5c6d7e8f90123456789abcdef0123456789abcdef0123456789abcde',
    chain: 'ETH',
    created_at: '2026-09-22T14:15:00Z',
    created_by: 'supervisor',
    assigned_role: 'SUPERVISOR',
    status: 'TRACING',
    active_trace_id: 'trace-sample-002',
    data_mode: 'CACHED',
    target_vasp: 'CoinDCX',
  },
];

let casesStore: CaseItem[] = [...INITIAL_CASES];

export const casesStub = {
  async listCases(currentUser?: User | null, mineOnly: boolean = false): Promise<CaseItem[]> {
    await new Promise((res) => setTimeout(res, 80));

    if (!currentUser) {
      const err: any = new Error('Unauthorized');
      err.response = { status: 401, data: { detail: 'Authentication required to list cases.' } };
      throw err;
    }

    // Role-based filtering per backend security requirements:
    // ADMIN can see all cases.
    // SUPERVISOR can see supervisor and investigator cases.
    // INVESTIGATOR only sees cases they created or are assigned to.
    if (currentUser.role === 'ADMIN') {
      return [...casesStore];
    }

    if (currentUser.role === 'SUPERVISOR') {
      return casesStore.filter(
        (c) => c.created_by === currentUser.username || c.assigned_role === 'INVESTIGATOR' || !mineOnly
      );
    }

    // INVESTIGATOR
    return casesStore.filter((c) => c.created_by === currentUser.username);
  },

  async getCase(caseId: string, currentUser?: User | null): Promise<CaseItem> {
    await new Promise((res) => setTimeout(res, 60));

    if (!currentUser) {
      const err: any = new Error('Unauthorized');
      err.response = { status: 401, data: { detail: 'Authentication required to view case details.' } };
      throw err;
    }

    const found = casesStore.find((c) => c.case_id === caseId);
    if (!found) {
      const err: any = new Error('Case not found');
      err.response = { status: 404, data: { detail: `Case '${caseId}' does not exist.` } };
      throw err;
    }

    // Check authorization: Investigator cannot view other investigators' private cases
    if (currentUser.role === 'INVESTIGATOR' && found.created_by !== currentUser.username) {
      const err: any = new Error('Forbidden');
      err.response = { status: 403, data: { detail: 'Forbidden: You do not have access to this case dossier.' } };
      throw err;
    }

    return found;
  },

  async createCase(payload: CreateCasePayload, currentUser?: User | null): Promise<CaseItem> {
    await new Promise((res) => setTimeout(res, 120));

    if (!currentUser) {
      const err: any = new Error('Unauthorized');
      err.response = { status: 401, data: { detail: 'Authentication required to create a case.' } };
      throw err;
    }

    // Validate fraud tx hash format strictly
    const cleanHash = payload.fraud_tx_hash.trim().toLowerCase();
    if (!cleanHash.match(/^0x[a-f0-9]{64}$/)) {
      const err: any = new Error('Invalid fraud transaction hash format');
      err.response = {
        status: 422,
        data: { detail: 'Invalid transaction hash. Must be 0x followed by exactly 64 hexadecimal characters.' },
      };
      throw err;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const newCaseId = `case_${payload.complaint_source.toLowerCase()}_2026_${randomSuffix}`;

    const newCase: CaseItem = {
      case_id: newCaseId,
      complaint_source: payload.complaint_source,
      complaint_ref: payload.complaint_ref.trim(),
      fraud_tx_hash: cleanHash,
      chain: payload.chain || 'ETH',
      created_at: new Date().toISOString(),
      created_by: currentUser.username,
      assigned_role: currentUser.role,
      status: 'PENDING',
      active_trace_id: `trace-${newCaseId}`,
      data_mode: 'LIVE',
    };

    casesStore.unshift(newCase);
    return newCase;
  },

  async startCaseTrace(
    caseId: string,
    payload: StartCaseTracePayload,
    currentUser?: User | null
  ): Promise<{ trace_id: string; status: string; data_mode: DataMode }> {
    await new Promise((res) => setTimeout(res, 150));

    const caseItem = await this.getCase(caseId, currentUser);

    const cleanHash = payload.fraud_tx_hash.trim().toLowerCase();
    if (!cleanHash.match(/^0x[a-f0-9]{64}$/)) {
      const err: any = new Error('Invalid fraud transaction hash format');
      err.response = {
        status: 422,
        data: { detail: 'Invalid transaction hash. Must be 0x followed by exactly 64 hexadecimal characters.' },
      };
      throw err;
    }

    caseItem.status = 'TRACING';
    caseItem.fraud_tx_hash = cleanHash;
    caseItem.active_trace_id = caseItem.active_trace_id || `trace-${caseItem.case_id}`;
    caseItem.data_mode = 'LIVE';

    return {
      trace_id: caseItem.active_trace_id,
      status: 'TRACING',
      data_mode: 'LIVE',
    };
  },
};
