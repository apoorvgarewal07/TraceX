import React from 'react';
import { AlertTriangle, ShieldCheck, AlertOctagon } from 'lucide-react';

interface RiskBadgeProps {
  score: number; // 0.0 to 1.0
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const RiskBadge: React.FC<RiskBadgeProps> = ({ score, showIcon = true, size = 'md' }) => {
  const percentage = Math.round(score * 100);

  let badgeColor = 'bg-emerald-950/80 text-emerald-400 border-emerald-800/80';
  let label = 'Low Risk';
  let Icon = ShieldCheck;

  if (score >= 0.8) {
    badgeColor = 'bg-rose-950/80 text-rose-400 border-rose-800/80 glow-danger';
    label = 'Severe Risk / Scammer';
    Icon = AlertOctagon;
  } else if (score >= 0.5) {
    badgeColor = 'bg-amber-950/80 text-amber-400 border-amber-800/80';
    label = 'Medium / Suspicious';
    Icon = AlertTriangle;
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 space-x-1',
    md: 'text-xs px-2.5 py-1 space-x-1.5 font-medium',
    lg: 'text-sm px-3.5 py-1.5 space-x-2 font-bold',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border ${badgeColor} ${sizeClasses[size]} transition-all`}
    >
      {showIcon && <Icon className="w-3.5 h-3.5 flex-shrink-0" />}
      <span>{percentage}% Risk</span>
      <span className="opacity-60 text-[10px] hidden sm:inline">({label})</span>
    </span>
  );
};
