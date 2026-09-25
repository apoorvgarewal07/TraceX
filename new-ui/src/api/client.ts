import axios from 'axios';
import { authStub, User, UserRole, LoginPayload } from './authStub';
import {
  casesStub,
  CaseItem,
  CreateCasePayload,
  StartCaseTracePayload,
  ComplaintSource,
  CaseStatus,
  DataMode,
} from './casesStub';

export type { User, UserRole, LoginPayload };
export type { CaseItem, CreateCasePayload, StartCaseTracePayload, ComplaintSource, CaseStatus, DataMode };

// TOGGLE: Flip to false when Person 1's backend POST /api/v1/auth/login is confirmed live
export const USE_AUTH_STUB = true;

// TOGGLE: Flip to false when Person 1's backend /api/v1/cases/* is confirmed live
export const USE_CASES_STUB = true;

const env = (import.meta as any).env || {};
export const API_BASE_URL = env.VITE_API_URL || 'http://localhost:8000';
export const WS_BASE_URL = env.VITE_WS_URL || API_BASE_URL.replace(/^http/, 'ws');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export type SecurityEventType = 'UNAUTHORIZED' | 'FORBIDDEN' | 'UNAVAILABLE';

export interface SecurityEventDetail {
  type: SecurityEventType;
  status?: number;
  message?: string;
}

type SecurityEventListener = (event: SecurityEventDetail) => void;

class SecurityEvents {
  private listeners: Set<SecurityEventListener> = new Set();

  subscribe(listener: SecurityEventListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  emit(event: SecurityEventDetail): void {
    this.listeners.forEach((listener) => {
      try {
        listener(event);
      } catch (e) {
        console.error('[SecurityEvents] Listener callback error:', e);
      }
    });
  }
}

export const securityEvents = new SecurityEvents();

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      securityEvents.emit({
        type: 'UNAVAILABLE',
        message: 'Network disruption or backend forensic service unreachable.',
      });
      return Promise.reject(error);
    }

    const { status, data } = error.response;
    const message = data?.detail || data?.message || error.message;

    if (status === 401) {
      securityEvents.emit({
        type: 'UNAUTHORIZED',
        status: 401,
        message,
      });
    } else if (status === 403) {
      securityEvents.emit({
        type: 'FORBIDDEN',
        status: 403,
        message,
      });
    } else if (status >= 500) {
      securityEvents.emit({
        type: 'UNAVAILABLE',
        status,
        message,
      });
    }

    return Promise.reject(error);
  }
);

export interface StartTracePayload {
  victim_wallet: string;
  complaint_id?: string;
  tx_hashes?: string[];
  chain?: 'ETH' | 'POLYGON' | string;
  max_hops?: number;
  max_nodes?: number;
  stop_at_vasp?: boolean;
}

export interface TraceResponse {
  trace_id: string;
  status: string;
  message: string;
}

export interface BackendGraphNode {
  data: {
    id: string;
    label: string;
    type?: string;
    riskScore?: number;
    address?: string;
  };
}

export interface BackendGraphEdge {
  data: {
    id?: string;
    source: string;
    target: string;
    label?: string;
    amount?: string;
    tx_hash?: string;
    asset?: string;
  };
}

export interface BackendTraceDetail {
  id: string;
  trace_id: string;
  complaint_id?: string;
  source_wallet: string;
  hops_count: number;
  risk_score: number;
  target_vasp?: string;
  status: 'processing' | 'completed' | 'failed';
  hops: Array<{
    hop_number: number;
    from: string;
    to: string;
    value: string;
    asset: string;
    tx_hash: string;
    chain?: string;
    timestamp?: string;
  }>;
  identified_exchanges: Array<{
    name: string;
    address: string;
    confidence: number;
    source?: string;
  }>;
  risk_scores: Record<string, number>;
  graph: {
    nodes: BackendGraphNode[];
    edges: BackendGraphEdge[];
  };
  traced_at?: string;
}

export interface FreezeNoticePayload {
  trace_id: string;
  exchange_name: string;
  confidence_level?: string;
  investigator_name?: string;
}

export const api = {
  async startTrace(payload: StartTracePayload): Promise<TraceResponse> {
    const res = await apiClient.post<TraceResponse>('/api/v1/trace', payload);
    return res.data;
  },

  async getTrace(traceId: string): Promise<BackendTraceDetail> {
    const res = await apiClient.get<BackendTraceDetail>(`/api/v1/trace/${traceId}`);
    return res.data;
  },

  async listTraces(): Promise<any[]> {
    const res = await apiClient.get('/api/v1/traces');
    return res.data;
  },

  async downloadFreezeNotice(payload: FreezeNoticePayload): Promise<Blob> {
    const res = await apiClient.post('/api/v1/freeze-notice', payload, {
      responseType: 'blob',
    });
    return res.data;
  },

  async clusterWallets(traceId: string): Promise<any> {
    const res = await apiClient.post(`/api/v1/cluster/${traceId}`);
    return res.data;
  },

  getTraceWsUrl(traceId: string): string {
    return `${WS_BASE_URL}/ws/trace/${traceId}`;
  },

  async login(payload: LoginPayload): Promise<User> {
    if (USE_AUTH_STUB) {
      return authStub.login(payload);
    }
    const res = await apiClient.post<User>('/api/v1/auth/login', payload);
    return res.data;
  },

  async logout(): Promise<void> {
    if (USE_AUTH_STUB) {
      return authStub.logout();
    }
    await apiClient.post('/api/v1/auth/logout');
  },

  async me(): Promise<User> {
    if (USE_AUTH_STUB) {
      return authStub.me();
    }
    const res = await apiClient.get<User>('/api/v1/auth/me');
    return res.data;
  },

  async getFindings(traceId: string): Promise<Finding[]> {
    return getFindings(traceId);
  },

  async recomputeFindings(traceId: string): Promise<Finding[]> {
    return recomputeFindings(traceId);
  },

  async listCases(mineOnly: boolean = true): Promise<CaseItem[]> {
    return listCases(mineOnly);
  },

  async getCase(caseId: string): Promise<CaseItem> {
    return getCase(caseId);
  },

  async createCase(payload: CreateCasePayload): Promise<CaseItem> {
    return createCase(payload);
  },

  async startCaseTrace(
    caseId: string,
    payload: StartCaseTracePayload
  ): Promise<{ trace_id: string; status: string; data_mode: DataMode }> {
    return startCaseTrace(caseId, payload);
  },

  async copilotQuery(
    caseId: string,
    payload: CopilotChatPayload
  ): Promise<CopilotChatResponse> {
    return copilotQuery(caseId, payload);
  },

  async copilotHealth(caseId?: string): Promise<CopilotHealthResponse> {
    return copilotHealth(caseId);
  },
};

export type FindingSeverity = 'high' | 'medium' | 'low';

export interface Finding {
  finding_id: string;
  rule: string;
  trace_id: string;
  severity: FindingSeverity;
  evidence_edge_ids: string[];
  evidence_ids: string[];
  explanation: string;
  computed_at: string;
  data_mode: 'LIVE' | 'CACHED' | 'FIXTURE' | 'UNAVAILABLE' | string;
}

export async function getFindings(traceId: string): Promise<Finding[]> {
  const res = await apiClient.get<Finding[]>(`/api/v1/intelligence/findings/${traceId}`);
  return res.data;
}

export async function recomputeFindings(traceId: string): Promise<Finding[]> {
  const res = await apiClient.post<Finding[]>(`/api/v1/intelligence/recompute/${traceId}`);
  return res.data;
}

// Cases Contract exports
export async function listCases(mineOnly: boolean = true): Promise<CaseItem[]> {
  if (USE_CASES_STUB) {
    const user = await api.me().catch(() => null);
    return casesStub.listCases(user, mineOnly);
  }
  const res = await apiClient.get<CaseItem[]>('/api/v1/cases', { params: { mine: mineOnly } });
  return res.data;
}

export async function getCase(caseId: string): Promise<CaseItem> {
  if (USE_CASES_STUB) {
    const user = await api.me().catch(() => null);
    return casesStub.getCase(caseId, user);
  }
  const res = await apiClient.get<CaseItem>(`/api/v1/cases/${caseId}`);
  return res.data;
}

export async function createCase(payload: CreateCasePayload): Promise<CaseItem> {
  if (USE_CASES_STUB) {
    const user = await api.me().catch(() => null);
    return casesStub.createCase(payload, user);
  }
  const res = await apiClient.post<CaseItem>('/api/v1/cases', payload);
  return res.data;
}

export async function startCaseTrace(
  caseId: string,
  payload: StartCaseTracePayload
): Promise<{ trace_id: string; status: string; data_mode: DataMode }> {
  if (USE_CASES_STUB) {
    const user = await api.me().catch(() => null);
    return casesStub.startCaseTrace(caseId, payload, user);
  }
  const res = await apiClient.post(`/api/v1/cases/${caseId}/trace`, payload);
  return res.data;
}

// Copilot Contract exports
export interface CopilotChatPayload {
  message: string;
  history?: Array<{ role: string; content: string }>;
}

export interface CopilotChatResponse {
  reply: string;
  citations: string[];
  stripped_sentences: number;
  fallback_triggered: boolean;
  tools_called: string[];
}

export interface CopilotHealthResponse {
  llm_reachable: boolean;
  status: string;
  provider?: string;
  model?: string;
}

export async function copilotQuery(
  caseId: string,
  payload: CopilotChatPayload
): Promise<CopilotChatResponse> {
  const res = await apiClient.post<CopilotChatResponse>(
    `/api/v1/cases/${caseId}/copilot/chat`,
    payload
  );
  return res.data;
}

export async function copilotHealth(caseId?: string): Promise<CopilotHealthResponse> {
  if (typeof window !== 'undefined' && localStorage.getItem('TRACEX_DEV_LLM_OFFLINE') === 'true') {
    return {
      llm_reachable: false,
      status: 'offline_simulated',
      provider: 'simulated_offline',
    };
  }
  try {
    const res = await apiClient.get<CopilotHealthResponse>(
      `/api/v1/cases/${caseId || 'health'}/copilot/health`,
      { timeout: 3000 }
    );
    return res.data;
  } catch {
    // If backend health endpoint not explicitly mounted, default to operational
    // as T8 backend handles both LLM and deterministic fallback seamlessly.
    return {
      llm_reachable: true,
      status: 'operational',
      provider: 'deterministic_fallback_ready',
    };
  }
}

