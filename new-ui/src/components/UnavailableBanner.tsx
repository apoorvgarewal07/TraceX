import React from 'react';
import { AlertTriangle, RefreshCw, X } from 'lucide-react';

interface UnavailableBannerProps {
  message?: string;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export function UnavailableBanner({
  message = 'Backend Forensic Service Unavailable. Running in offline/disconnected state.',
  onRetry,
  onDismiss,
}: UnavailableBannerProps) {
  return (
    <div className="w-full bg-[#3D2510] border-b border-[#78471A] text-[#EDE8DE] px-4 py-2 text-xs flex items-center justify-between gap-3 shadow-md z-50">
      <div className="flex items-center gap-2.5">
        <AlertTriangle className="h-4 w-4 text-[#D97706] shrink-0" />
        <span className="font-semibold text-[#FBBF24] tracking-wide uppercase text-[11px]">
          [UNAVAILABLE]
        </span>
        <span className="text-[#EDE8DE]">{message}</span>
      </div>

      <div className="flex items-center gap-3">
        {onRetry && (
          <button
            type="button"
            onClick={onRetry}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#5A3515] hover:bg-[#6D3F19] text-[#EDE8DE] text-[11px] font-medium transition-colors border border-[#8C4E1A] cursor-pointer"
          >
            <RefreshCw className="h-3 w-3" />
            <span>Retry Connection</span>
          </button>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            className="text-[#A8A399] hover:text-[#EDE8DE] p-0.5 transition-colors cursor-pointer"
            aria-label="Dismiss banner"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}
