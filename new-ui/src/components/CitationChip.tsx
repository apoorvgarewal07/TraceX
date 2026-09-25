import React, { useState } from 'react';
import { Shield, GitCommit, Hash, Building2, FileCheck, ExternalLink, Check } from 'lucide-react';

export interface CitationChipProps {
  key?: React.Key;
  citation: string;
  onSelect?: (type: string, id: string) => void;
  active?: boolean;
  className?: string;
}

export function CitationChip({ citation, onSelect, active = false, className = '' }: CitationChipProps) {
  const [clicked, setClicked] = useState(false);

  // Parse [type:id] or type:id
  const match = citation.trim().match(/^\[?(tx|edge|finding|exit|evidence):\s*([^\]\s]+)\]?$/i);
  const type = match ? match[1].toLowerCase() : 'evidence';
  const id = match ? match[2] : citation.replace(/^\[|\]$/g, '');

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setClicked(true);
    setTimeout(() => setClicked(false), 1200);
    if (onSelect) {
      onSelect(type, id);
    }
  };

  const getBadgeStyle = () => {
    switch (type) {
      case 'finding':
        return {
          icon: <Shield className="h-3 w-3 text-purple-400" />,
          classes: 'border-purple-500/40 bg-purple-950/40 text-purple-200 hover:bg-purple-900/60 hover:border-purple-400',
          activeClasses: 'ring-1 ring-purple-400 bg-purple-900/70',
          label: 'FINDING',
        };
      case 'edge':
        return {
          icon: <GitCommit className="h-3 w-3 text-amber-400" />,
          classes: 'border-amber-500/40 bg-amber-950/40 text-amber-200 hover:bg-amber-900/60 hover:border-amber-400',
          activeClasses: 'ring-1 ring-amber-400 bg-amber-900/70',
          label: 'EDGE',
        };
      case 'tx':
        return {
          icon: <Hash className="h-3 w-3 text-cyan-400" />,
          classes: 'border-cyan-500/40 bg-cyan-950/40 text-cyan-200 hover:bg-cyan-900/60 hover:border-cyan-400',
          activeClasses: 'ring-1 ring-cyan-400 bg-cyan-900/70',
          label: 'TX',
        };
      case 'exit':
        return {
          icon: <Building2 className="h-3 w-3 text-emerald-400" />,
          classes: 'border-emerald-500/40 bg-emerald-950/40 text-emerald-200 hover:bg-emerald-900/60 hover:border-emerald-400',
          activeClasses: 'ring-1 ring-emerald-400 bg-emerald-900/70',
          label: 'EXIT',
        };
      default:
        return {
          icon: <FileCheck className="h-3 w-3 text-blue-400" />,
          classes: 'border-blue-500/40 bg-blue-950/40 text-blue-200 hover:bg-blue-900/60 hover:border-blue-400',
          activeClasses: 'ring-1 ring-blue-400 bg-blue-900/70',
          label: 'EVID',
        };
    }
  };

  const style = getBadgeStyle();
  const displayId = id.length > 18 ? `${id.slice(0, 8)}...${id.slice(-6)}` : id;

  return (
    <button
      type="button"
      onClick={handleClick}
      title={`Click to inspect & highlight: ${citation}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 my-0.5 rounded text-[11px] font-mono border transition-all duration-150 cursor-pointer shadow-sm ${
        style.classes
      } ${active || clicked ? style.activeClasses : ''} ${className}`}
    >
      {clicked ? <Check className="h-3 w-3 text-emerald-300" /> : style.icon}
      <span className="opacity-75 font-semibold text-[10px] tracking-wider">{style.label}:</span>
      <span className="font-medium">{displayId}</span>
      <ExternalLink className="h-2.5 w-2.5 opacity-40 ml-0.5" />
    </button>
  );
}
