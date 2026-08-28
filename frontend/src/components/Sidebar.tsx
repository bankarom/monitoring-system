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
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 justify-between">
        <div className="flex items-center gap-2">
          <img src="/logo.png" alt="Improx Logo" className="h-8 object-contain" />
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
            PRO
          </span>
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
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-sky-50 text-sky-700 font-bold border border-sky-200 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon className="w-4 h-4" />
                <span>{item.name}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-emerald-100 text-emerald-700 border border-emerald-300 animate-pulse">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 text-center bg-slate-50/50">
        <p className="text-[11px] text-slate-600 font-semibold">Improx Monitoring v1.0.0</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Proprietary Enterprise Engine</p>
      </div>
    </aside>
  );
};