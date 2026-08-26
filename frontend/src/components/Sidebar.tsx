import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Radio,
  Users,
  Image,
  Clock,
  PieChart,
  Globe,
  CalendarCheck,
  Settings,
  ShieldCheck
} from 'lucide-react';

const navigation = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Live Monitor', href: '/realtime', icon: Radio, badge: 'LIVE' },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Screenshots', href: '/screenshots', icon: Image },
  { name: '24h Timeline', href: '/timeline', icon: Clock },
  { name: 'App Analytics', href: '/analytics/apps', icon: PieChart },
  { name: 'Web History', href: '/analytics/websites', icon: Globe },
  { name: 'Timesheets', href: '/timesheets', icon: CalendarCheck },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

export const Sidebar: React.FC = () => {
  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-bold text-base tracking-wide text-white flex items-center gap-1.5">
            IMPROX <span className="text-sky-400 font-semibold text-xs px-1.5 py-0.5 rounded bg-sky-950/80 border border-sky-800/50">PRO</span>
          </h1>
          <p className="text-[11px] text-slate-400 font-medium">Enterprise Monitoring</p>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.href}
              end={item.href === '/'}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-600/15 text-sky-400 border border-sky-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-800 text-center">
        <p className="text-[11px] text-slate-400 font-medium">Improx Monitoring v1.0.0</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Proprietary Clean Engine</p>
      </div>
    </aside>
  );
};