import { useState, useEffect, useCallback, useRef } from 'react';
import { copilotQuery, copilotHealth, CopilotChatResponse, CopilotHealthResponse } from '../api/client';

export interface ChatMessage {
  id: string;
  role: 'investigator' | 'copilot' | 'system';
  content: string;
  citations: string[];
  stripped_sentences: number;
  fallback_triggered: boolean;
  timestamp: string;
}

const INITIAL_WELCOME_MESSAGE: ChatMessage = {
  id: 'msg-welcome',
  role: 'copilot',
  content:
    'Grounded Forensic Copilot active. Inquiries are strictly grounded in deterministic ledger evidence and verified rule findings. Questions requiring judicial determinations of guilt will be refused.',
  citations: [],
  stripped_sentences: 0,
  fallback_triggered: false,
  timestamp: new Date().toISOString(),
};

export function useCopilot(caseId?: string, _traceId?: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_WELCOME_MESSAGE]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [llmReachable, setLlmReachable] = useState(true);
  const [healthInfo, setHealthInfo] = useState<CopilotHealthResponse | null>(null);

  const activeCaseId = caseId || 'trace-case-default';
  const pollTimerRef = useRef<any>(null);

  // Health check on mount and interval
  const checkHealth = useCallback(async () => {
    try {
      const res = await copilotHealth(activeCaseId);
      setLlmReachable(res.llm_reachable);
      setHealthInfo(res);
    } catch {
      setLlmReachable(true); // Default to operational with deterministic fallback
    }
  }, [activeCaseId]);

  useEffect(() => {
    checkHealth();
    pollTimerRef.current = setInterval(checkHealth, 30000);
    return () => {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [checkHealth]);

  const toggleSimulateOffline = useCallback(() => {
    const current = localStorage.getItem('TRACEX_DEV_LLM_OFFLINE') === 'true';
    if (current) {
      localStorage.removeItem('TRACEX_DEV_LLM_OFFLINE');
    } else {
      localStorage.setItem('TRACEX_DEV_LLM_OFFLINE', 'true');
    }
    checkHealth();
  }, [checkHealth]);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading || !llmReachable) return;

      const userMsgId = `msg-user-${Date.now()}`;
      const userMsg: ChatMessage = {
        id: userMsgId,
        role: 'investigator',
        content: trimmed,
        citations: [],
        stripped_sentences: 0,
        fallback_triggered: false,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setLoading(true);
      setError(null);

      // Build history payload for backend
      const historyPayload = messages
        .filter((m) => m.role !== 'system')
        .slice(-6)
        .map((m) => ({
          role: m.role === 'investigator' ? 'user' : 'assistant',
          content: m.content,
        }));

      try {
        const response: CopilotChatResponse = await copilotQuery(activeCaseId, {
          message: trimmed,
          history: historyPayload,
        });

        const copilotMsg: ChatMessage = {
          id: `msg-copilot-${Date.now()}`,
          role: 'copilot',
          content: response.reply,
          citations: response.citations || [],
          stripped_sentences: response.stripped_sentences || 0,
          fallback_triggered: response.fallback_triggered || false,
          timestamp: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, copilotMsg]);
      } catch (err: any) {
        const errMsg = err?.response?.data?.detail || err?.message || 'Failed to query Grounded Copilot';
        setError(errMsg);

        const errorMsg: ChatMessage = {
          id: `msg-err-${Date.now()}`,
          role: 'system',
          content: `Copilot error: ${errMsg}`,
          citations: [],
          stripped_sentences: 0,
          fallback_triggered: true,
          timestamp: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setLoading(false);
      }
    },
    [activeCaseId, loading, llmReachable, messages]
  );

  const clearHistory = useCallback(() => {
    setMessages([INITIAL_WELCOME_MESSAGE]);
    setError(null);
  }, []);

  return {
    messages,
    loading,
    error,
    llmReachable,
    healthInfo,
    sendMessage,
    clearHistory,
    checkHealth,
    toggleSimulateOffline,
    setLlmReachable,
  };
}
