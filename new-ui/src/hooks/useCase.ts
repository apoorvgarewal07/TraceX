import { useState, useEffect, useCallback } from 'react';
import {
  CaseItem,
  CreateCasePayload,
  StartCaseTracePayload,
  DataMode,
  listCases,
  getCase,
  createCase,
  startCaseTrace,
} from '../api/client';

export interface UseCasesResult {
  cases: CaseItem[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createNewCase: (payload: CreateCasePayload) => Promise<CaseItem>;
}

export function useCases(mineOnly: boolean = true): UseCasesResult {
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCases = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listCases(mineOnly);
      setCases(data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to load case dossiers';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [mineOnly]);

  const handleCreateCase = useCallback(
    async (payload: CreateCasePayload): Promise<CaseItem> => {
      setLoading(true);
      setError(null);
      try {
        const created = await createCase(payload);
        setCases((prev) => [created, ...prev]);
        return created;
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || 'Failed to create case dossier';
        setError(msg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  return {
    cases,
    loading,
    error,
    refresh: fetchCases,
    createNewCase: handleCreateCase,
  };
}

export interface UseCaseDetailResult {
  caseData: CaseItem | null;
  loading: boolean;
  error: string | null;
  isTracing: boolean;
  refresh: () => Promise<void>;
  launchTrace: (payload: StartCaseTracePayload) => Promise<{ trace_id: string; status: string; data_mode: DataMode }>;
}

export function useCaseDetail(caseId?: string): UseCaseDetailResult {
  const [caseData, setCaseData] = useState<CaseItem | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isTracing, setIsTracing] = useState<boolean>(false);

  const fetchDetail = useCallback(async () => {
    if (!caseId) {
      setCaseData(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getCase(caseId);
      setCaseData(data);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to retrieve case details';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const handleLaunchTrace = useCallback(
    async (payload: StartCaseTracePayload) => {
      if (!caseId) {
        throw new Error('No active case selected for trace launch.');
      }
      setIsTracing(true);
      setError(null);
      try {
        const res = await startCaseTrace(caseId, payload);
        if (caseData) {
          setCaseData({
            ...caseData,
            status: 'TRACING',
            active_trace_id: res.trace_id,
            data_mode: res.data_mode,
            fraud_tx_hash: payload.fraud_tx_hash,
          });
        }
        return res;
      } catch (err: any) {
        const msg = err.response?.data?.detail || err.message || 'Trace initiation failed';
        setError(msg);
        throw err;
      } finally {
        setIsTracing(false);
      }
    },
    [caseId, caseData]
  );

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    caseData,
    loading,
    error,
    isTracing,
    refresh: fetchDetail,
    launchTrace: handleLaunchTrace,
  };
}
