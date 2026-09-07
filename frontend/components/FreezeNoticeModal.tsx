import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { FileText, Download, X, ShieldAlert, CheckCircle } from 'lucide-react';

interface FreezeNoticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  traceId: string;
  defaultExchange?: string;
  sourceWallet?: string;
  riskScore?: number;
}

export const FreezeNoticeModal: React.FC<FreezeNoticeModalProps> = ({
  isOpen,
  onClose,
  traceId,
  defaultExchange = 'Binance',
  sourceWallet = '',
  riskScore = 0.9,
}) => {
  const [exchangeName, setExchangeName] = useState(defaultExchange || 'Binance');
  const [investigatorName, setInvestigatorName] = useState('Officer Cyber Crime Unit (I4C)');
  const [confidenceLevel, setConfidenceLevel] = useState('HIGH');
  const [downloading, setDownloading] = useState(false);

  if (!isOpen) return null;

  const exchangesList = [
    'Binance',
    'CoinDCX',
    'WazirX',
    'Kraken',
    'Coinbase',
    'KuCoin',
    'OKX',
    'Bybit',
    'Gate.io',
    'Tornado.Cash (Relayer/Blacklist Directive)',
  ];

  const handleDownloadPDF = async () => {
    setDownloading(true);
    const toastId = toast.loading('Generating Statutory Freeze Directive PDF...');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const response = await axios.post(
        `${apiUrl}/api/v1/freeze-notice`,
        {
          trace_id: traceId,
          exchange_name: exchangeName,
          confidence_level: confidenceLevel,
          investigator_name: investigatorName,
        },
        { responseType: 'blob' }
      );

      // Create download link
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Freeze_Notice_${exchangeName.replace(/\s+/g, '_')}_${traceId.substring(0, 8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Freeze Notice PDF generated & downloaded successfully!', { id: toastId });
      onClose();
    } catch (err: any) {
      toast.error('Failed to generate freeze notice PDF', { id: toastId });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="glass-panel w-full max-w-xl rounded-2xl border border-slate-700 p-6 sm:p-8 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 rounded-xl bg-rose-950/80 text-rose-400 border border-rose-800/60">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Generate Statutory Asset Freeze Directive</h2>
            <p className="text-xs text-slate-400">Section 91 CrPC & Information Technology Act 2000</p>
          </div>
        </div>

        {/* Notice Target Details */}
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Target Virtual Asset Service Provider (VASP / Exchange)
            </label>
            <select
              value={exchangeName}
              onChange={(e) => setExchangeName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0a0f1d] border border-slate-700 rounded-xl text-slate-100 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-none"
            >
              {exchangesList.map((ex) => (
                <option key={ex} value={ex}>
                  {ex}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Authorized Investigating Officer / Unit Title
            </label>
            <input
              type="text"
              value={investigatorName}
              onChange={(e) => setInvestigatorName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-[#0a0f1d] border border-slate-700 rounded-xl text-slate-100 text-sm font-medium focus:ring-2 focus:ring-rose-500 focus:outline-none"
            />
          </div>

          <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Trace Reference ID:</span>
              <span className="font-mono text-slate-200">{traceId.substring(0, 16)}...</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Victim Address:</span>
              <span className="font-mono text-slate-200 truncate max-w-[240px]">{sourceWallet}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Forensic Risk Assessment:</span>
              <span className="text-rose-400 font-bold">{Math.round(riskScore * 100)}% (Anomalous Flow)</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Statutory Compliance Window:</span>
              <span className="text-amber-400 font-bold">24 Hours from delivery</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-sm transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownloadPDF}
            disabled={downloading}
            className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white font-bold text-sm shadow-lg shadow-rose-600/30 flex items-center justify-center space-x-2 transition disabled:opacity-50"
          >
            {downloading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Building PDF...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>DOWNLOAD LEGAL NOTICE</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
