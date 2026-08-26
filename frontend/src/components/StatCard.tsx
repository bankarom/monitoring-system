import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  color: 'sky' | 'emerald' | 'amber' | 'rose' | 'indigo';
  badge?: string;
}

const colorMap = {
  sky: 'from-sky-500/10 to-sky-600/5 text-sky-400 border-sky-500/20 shadow-sky-500/5',
  emerald: 'from-emerald-500/10 to-emerald-600/5 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5',
  amber: 'from-amber-500/10 to-amber-600/5 text-amber-400 border-amber-500/20 shadow-amber-500/5',
  rose: 'from-rose-500/10 to-rose-600/5 text-rose-400 border-rose-500/20 shadow-rose-500/5',
  indigo: 'from-indigo-500/10 to-indigo-600/5 text-indigo-400 border-indigo-500/20 shadow-indigo-500/5',
};

const iconBgMap = {
  sky: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  emerald: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  amber: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  rose: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
};

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  badge
}) => {
  return (
    <div className={`p-5 rounded-2xl bg-gradient-to-br border ${colorMap[color]} shadow-lg relative overflow-hidden backdrop-blur-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-extrabold text-white mt-1.5">{value}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-1 font-medium">{subtitle}</p>}
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${iconBgMap[color]}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {badge && (
        <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <span className="text-slate-400">Status</span>
          <span className="font-semibold text-slate-300">{badge}</span>
        </div>
      )}
    </div>
  );
};