import { useEffect, useState, useRef } from 'react';

export interface WSHopEvent {
  hop_number: number;
  from: string;
  to: string;
  value: string;
  tx_hash: string;
  asset?: string;
  chain?: string;
}

export const useWebSocket = (traceId?: string) => {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'completed' | 'failed' | 'disconnected'>('connecting');
  const [hops, setHops] = useState<WSHopEvent[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [latestMessage, setLatestMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!traceId) return;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const wsUrl = apiUrl.replace(/^http/, 'ws') + `/ws/trace/${traceId}`;

    let ws: WebSocket;
    try {
      ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setStatus('connected');
        ws.send(JSON.stringify({ subscribe: traceId }));
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLatestMessage(data);

          if (data.event === 'HOP_DISCOVERED') {
            setHops((prev) => [...prev, data.hop]);
            setProgress((prev) => Math.min(prev + 8, 95));
          } else if (data.event === 'TRACE_COMPLETED') {
            setStatus('completed');
            setProgress(100);
          } else if (data.event === 'TRACE_FAILED') {
            setStatus('failed');
          }
        } catch (e) {
          console.error("Failed to parse WS event", e);
        }
      };

      ws.onerror = () => {
        setStatus('disconnected');
      };

      ws.onclose = () => {
        setStatus((prev) => (prev === 'completed' ? 'completed' : 'disconnected'));
      };
    } catch (e) {
      setStatus('disconnected');
    }

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [traceId]);

  return { status, hops, progress, latestMessage };
};
