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
  sky: 'border-slate-200 text-sky-600',
  emerald: 'border-slate-200 text-emerald-600',
  amber: 'border-slate-200 text-amber-600',
  rose: 'border-slate-200 text-rose-600',
  indigo: 'border-slate-200 text-indigo-600',
};

const iconBgMap = {
  sky: 'bg-sky-50 text-sky-600 border-sky-200',
  emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
  amber: 'bg-amber-50 text-amber-600 border-amber-200',
  rose: 'bg-rose-50 text-rose-600 border-rose-200',
  indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
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
    <div className={`p-5 rounded-2xl bg-white border ${colorMap[color]} shadow-xs hover:shadow-md transition-shadow relative overflow-hidden`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">{title}</p>
          <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1.5">{value}</h3>
          {subtitle && <p className="text-xs text-slate-500 mt-1 font-medium">{subtitle}</p>}
        </div>

        <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${iconBgMap[color]} shadow-xs`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {badge && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className="text-slate-500 font-medium">Status</span>
          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">{badge}</span>
        </div>
      )}
    </div>
  );
};