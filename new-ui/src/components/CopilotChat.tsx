import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  Send,
  Loader2,
  AlertTriangle,
  ShieldCheck,
  RotateCcw,
  Sparkles,
  Info,
  Scale,
  WifiOff,
  Wifi,
} from 'lucide-react';
import { useCopilot, ChatMessage } from '../hooks/useCopilot';
import { CitationChip } from './CitationChip';

interface CopilotChatProps {
  caseId?: string;
  traceId?: string;
  onHighlightEdges?: (edgeIds: string[]) => void;
  onSelectFinding?: (findingId: string) => void;
  className?: string;
}

const QUICK_PROMPTS = [
  { label: 'Summarize Evidence', prompt: 'Summarize trace evidence and flow findings.' },
  { label: 'High-Severity Findings', prompt: 'List all high-severity findings identified in this trace.' },
  { label: 'Exchange Exits', prompt: 'Which centralized exchange exits or off-ramps were reached?' },
  { label: 'Is Wallet Guilty? (Refusal Test)', prompt: 'Is this wallet guilty of fraud?' },
];

export function CopilotChat({
  caseId,
  traceId,
  onHighlightEdges,
  onSelectFinding,
  className = '',
}: CopilotChatProps) {
  const {
    messages,
    loading,
    error,
    llmReachable,
    sendMessage,
    clearHistory,
    toggleSimulateOffline,
  } = useCopilot(caseId, traceId);

  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || loading || !llmReachable) return;
    const text = input;
    setInput('');
    await sendMessage(text);
  };

  const handleCitationClick = (type: string, id: string) => {
    if (type === 'edge' && onHighlightEdges) {
      onHighlightEdges([id]);
    } else if (type === 'finding') {
      if (onSelectFinding) onSelectFinding(id);
      if (onHighlightEdges) onHighlightEdges([id]);
    } else if (type === 'tx' && onHighlightEdges) {
      onHighlightEdges([id]);
    } else if (type === 'exit' && onHighlightEdges) {
      onHighlightEdges([id]);
    } else if (onHighlightEdges) {
      onHighlightEdges([id]);
    }
  };

  // Helper to parse message text and render inline CitationChips
  const renderMessageContent = (content: string) => {
    const citationRegex = /(\[(?:tx|edge|finding|exit|evidence):\s*[^\]\s]+\])/gi;
    const parts = content.split(citationRegex);

    return parts.map((part, index) => {
      if (part.match(citationRegex)) {
        return (
          <CitationChip
            key={index}
            citation={part}
            onSelect={handleCitationClick}
          />
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div className={`flex flex-col h-full bg-[#161418] border border-[#2A272D] rounded-xl overflow-hidden ${className}`}>
      {/* Copilot Header */}
      <div className="px-4 py-3 border-b border-[#2A272D] bg-[#141215] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-[#B8935F]/15 border border-[#B8935F]/30 text-[#B8935F]">
            <Bot className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-wide text-[#EDE8DE]">Grounded AI Copilot</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#3B6B54]/40 bg-[#3B6B54]/20 text-[#34D399] flex items-center gap-1">
                <ShieldCheck className="h-2.5 w-2.5" />
                Zero-Hallucination
              </span>
            </div>
            <p className="text-[10px] text-[#7E7972]">Adversarial citation validator active • Pure forensic reasoning</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Offline simulator toggle button for acceptance testing */}
          <button
            type="button"
            onClick={toggleSimulateOffline}
            title={llmReachable ? 'Click to simulate LLM offline state' : 'Click to restore LLM online state'}
            className={`px-2 py-1 rounded text-[10px] font-mono border flex items-center gap-1 transition-colors ${
              llmReachable
                ? 'border-[#2E2B32] text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#242227]'
                : 'border-[#E05A47]/40 bg-[#8C3B3B]/20 text-[#E05A47]'
            }`}
          >
            {llmReachable ? <Wifi className="h-3 w-3 text-[#34D399]" /> : <WifiOff className="h-3 w-3 text-[#E05A47]" />}
            <span>{llmReachable ? 'LLM Live' : 'LLM Offline'}</span>
          </button>

          <button
            type="button"
            onClick={clearHistory}
            title="Reset conversation"
            className="p-1.5 rounded text-[#7E7972] hover:text-[#EDE8DE] hover:bg-[#242227] transition-colors"
          >
            <RotateCcw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* Disabled State Banner when llm_reachable === false */}
      {!llmReachable && (
        <div className="px-4 py-2.5 bg-[#8C3B3B]/15 border-b border-[#8C3B3B]/40 text-xs text-[#E05A47] flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0 text-[#E05A47]" />
          <span className="font-medium">
            Copilot is unavailable. Deterministic findings below are unaffected.
          </span>
        </div>
      )}

      {/* Chat Messages Viewport */}
      <div className="flex-1 p-4 overflow-y-auto space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'investigator' ? 'items-end' : 'items-start'
            }`}
          >
            <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] font-mono text-[#7E7972]">
              {msg.role === 'investigator' ? (
                <span>Investigator</span>
              ) : msg.role === 'system' ? (
                <span className="text-[#E05A47]">System Notice</span>
              ) : (
                <span className="text-[#B8935F] flex items-center gap-1">
                  <Bot className="h-3 w-3" />
                  Grounded Copilot
                </span>
              )}
              <span>•</span>
              <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>

            <div
              className={`max-w-[85%] rounded-xl px-4 py-3 text-xs leading-relaxed border ${
                msg.role === 'investigator'
                  ? 'bg-[#B8935F]/15 border-[#B8935F]/30 text-[#EDE8DE]'
                  : msg.role === 'system'
                  ? 'bg-[#8C3B3B]/10 border-[#8C3B3B]/30 text-[#E05A47]'
                  : 'bg-[#1C1A1E] border-[#2E2B32] text-[#EDE8DE]'
              }`}
            >
              {/* Fallback Badge per Blueprint §3.4 */}
              {msg.role === 'copilot' && msg.fallback_triggered && (
                <div className="mb-2 px-2 py-1 rounded bg-[#C68A4C]/15 border border-[#C68A4C]/40 text-[11px] text-[#C68A4C] flex items-center gap-1.5">
                  <Info className="h-3.5 w-3.5 flex-shrink-0" />
                  <span className="font-medium">answered from findings, not AI</span>
                </div>
              )}

              {/* Stripped Sentences Warning Badge */}
              {msg.role === 'copilot' && msg.stripped_sentences > 0 && (
                <div className="mb-2 px-2 py-0.5 rounded bg-[#8C3B3B]/15 border border-[#8C3B3B]/30 text-[10px] text-[#E05A47] flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" />
                  <span>{msg.stripped_sentences} uncited statement(s) stripped by validator</span>
                </div>
              )}

              {/* Message Body with inline citations */}
              <div className="whitespace-pre-wrap">{renderMessageContent(msg.content)}</div>

              {/* Citations footer list */}
              {msg.role === 'copilot' && msg.citations && msg.citations.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-[#2A272D]/60">
                  <p className="text-[10px] font-mono text-[#7E7972] mb-1.5 flex items-center gap-1">
                    <Scale className="h-3 w-3 text-[#B8935F]" />
                    <span>Verified Evidence Citations ({msg.citations.length}):</span>
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {msg.citations.map((c, i) => (
                      <CitationChip
                        key={i}
                        citation={c}
                        onSelect={handleCitationClick}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs text-[#A8A399] p-2 bg-[#1C1A1E] border border-[#2E2B32] rounded-lg w-fit">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-[#B8935F]" />
            <span>Consulting deterministic forensic tools & verifying citations...</span>
          </div>
        )}

        {error && !loading && (
          <div className="p-2.5 rounded bg-[#8C3B3B]/15 border border-[#8C3B3B]/30 text-xs text-[#E05A47] flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Prompts */}
      {llmReachable && (
        <div className="px-4 py-2 border-t border-[#2A272D]/60 bg-[#141215]/60 flex items-center gap-1.5 overflow-x-auto text-[11px]">
          <span className="text-[#7E7972] text-[10px] flex items-center gap-1 flex-shrink-0">
            <Sparkles className="h-3 w-3 text-[#B8935F]" />
            Suggested:
          </span>
          {QUICK_PROMPTS.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => sendMessage(p.prompt)}
              disabled={loading}
              className="px-2.5 py-1 rounded bg-[#1F1D22] border border-[#2A272D] text-[#A8A399] hover:text-[#EDE8DE] hover:border-[#B8935F]/40 whitespace-nowrap transition-colors disabled:opacity-50"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}

      {/* Chat Input Bar */}
      <form onSubmit={handleSend} className="p-3 border-t border-[#2A272D] bg-[#141215] flex items-center gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={!llmReachable || loading}
          placeholder={
            !llmReachable
              ? 'Copilot is unavailable. Deterministic findings below are unaffected.'
              : 'Ask forensic query (e.g. summarize findings, list mixer hops)...'
          }
          className="flex-1 bg-[#1A181D] border border-[#2E2B32] rounded-lg px-3 py-2 text-xs text-[#EDE8DE] placeholder-[#7E7972] focus:outline-none focus:border-[#B8935F] disabled:opacity-50 disabled:bg-[#151317] disabled:cursor-not-allowed"
        />
        <button
          type="submit"
          disabled={!llmReachable || loading || !input.trim()}
          className="px-3.5 py-2 rounded-lg bg-[#B8935F] hover:bg-[#CFAC78] text-[#131114] font-semibold text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          <span>Send</span>
        </button>
      </form>
    </div>
  );
}
