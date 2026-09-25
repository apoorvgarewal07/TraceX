import { useState, useEffect, useCallback } from 'react';
import { Finding, getFindings, recomputeFindings } from '../api/client';

export interface UseFindingsResult {
  findings: Finding[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  recompute: () => Promise<void>;
}

export function useFindings(traceId?: string): UseFindingsResult {
  const [findings, setFindings] = useState<Finding[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFindings = useCallback(async () => {
    if (!traceId) {
      setFindings([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const data = await getFindings(traceId);
      setFindings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to retrieve intelligence findings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  const handleRecompute = useCallback(async () => {
    if (!traceId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await recomputeFindings(traceId);
      setFindings(Array.isArray(data) ? data : []);
    } catch (err: any) {
      const msg = err.response?.data?.detail || err.message || 'Failed to recompute intelligence findings';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [traceId]);

  useEffect(() => {
    fetchFindings();
  }, [fetchFindings]);

  return {
    findings,
    loading,
    error,
    refresh: fetchFindings,
    recompute: handleRecompute,
  };
}
