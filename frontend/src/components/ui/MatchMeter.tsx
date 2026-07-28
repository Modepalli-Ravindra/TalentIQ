import React from 'react';
import { Sparkles } from 'lucide-react';

interface MatchMeterProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const MatchMeter: React.FC<MatchMeterProps> = ({ score, size = 'md', showLabel = true }) => {
  const getScoreColor = (val: number) => {
    if (val >= 90) return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10 glow-emerald';
    if (val >= 75) return 'text-blue-400 border-blue-500/40 bg-blue-500/10 glow-blue';
    if (val >= 60) return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
    return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
  };

  const getBadgeStyle = () => {
    switch (size) {
      case 'sm':
        return 'px-2 py-0.5 text-xs font-semibold';
      case 'lg':
        return 'px-3.5 py-1.5 text-base font-bold';
      default:
        return 'px-2.5 py-1 text-sm font-semibold';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1.5 rounded-full border backdrop-blur-md transition-all ${getScoreColor(score)} ${getBadgeStyle()}`}>
      <Sparkles className={size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-4 h-4' : 'w-3.5 h-3.5'} />
      <span>{score}% Match</span>
      {showLabel && size === 'lg' && (
        <span className="text-xs text-gray-400 font-normal ml-1">AI Fit</span>
      )}
    </div>
  );
};
