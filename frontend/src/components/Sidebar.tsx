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
  ShieldCheck,
  Download,
  UserCheck
} from 'lucide-react';

import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

interface NavItem {
  name: string;
  href: string;
  icon: any;
  badge?: string;
}

const adminNavigation: NavItem[] = [
  { name: 'Overview', href: '/', icon: LayoutDashboard },
  { name: 'Live Monitor', href: '/realtime', icon: Radio, badge: 'LIVE' },
  { name: 'Employees', href: '/employees', icon: Users },
  { name: 'Screenshots', href: '/screenshots', icon: Image },
  { name: '24h Timeline', href: '/timeline', icon: Clock },
  { name: 'App Analytics', href: '/analytics/apps', icon: PieChart },
  { name: 'Timesheets', href: '/timesheets', icon: CalendarCheck },
  { name: 'System Settings', href: '/settings', icon: Settings },
];

const employeeNavigation: NavItem[] = [
  { name: 'My Dashboard', href: '/portal?tab=timeline', icon: LayoutDashboard },
  { name: 'My Screenshots', href: '/portal?tab=screenshots', icon: Image },
  { name: 'My Activity & Apps', href: '/portal?tab=apps', icon: PieChart },
  { name: 'My Timesheet', href: '/portal?tab=timeline', icon: CalendarCheck },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const navigation = user?.role === 'EMPLOYEE' ? employeeNavigation : adminNavigation;

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-screen select-none shrink-0 shadow-sm">
      {/* Brand Header */}
      <div className="h-16 flex items-center px-5 border-b border-slate-200 justify-between">
        <div className="flex items-center gap-2">
          <img src={logoImg || "/logo.png"} alt="Improx Logo" className="h-7 w-auto max-w-[130px] object-contain" />
          <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-sky-50 text-sky-700 border border-sky-200 uppercase tracking-wide">
            {user?.role === 'EMPLOYEE' ? 'EMPLOYEE' : 'PRO'}
          </span>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navigation.map((item, idx) => {
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

      {/* Desktop Agent (.exe) CTA Card */}
      <div className="mx-3 mb-2 p-3 rounded-2xl bg-gradient-to-br from-indigo-600 to-sky-600 text-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <Download className="w-4 h-4 text-white" />
          <span className="text-xs font-black tracking-tight">Desktop Agent (.exe)</span>
        </div>
        <p className="text-[10px] text-sky-100 leading-snug mb-2 font-medium">
          Run on your PC to test live screenshot capture & telemetry.
        </p>
        <a
          href="https://github.com/bankarom/monitoring-system/releases"
          target="_blank"
          rel="noreferrer"
          className="block w-full text-center py-1.5 px-2 bg-white text-indigo-700 hover:bg-sky-50 rounded-xl text-[11px] font-black transition-transform hover:scale-[1.02] shadow-xs"
        >
          Download .exe Agent
        </a>
      </div>

      {/* Footer Info */}
      <div className="p-4 border-t border-slate-200 text-center bg-slate-50/50">
        <p className="text-[11px] text-slate-600 font-semibold">Improx Monitoring v1.0.0</p>
        <p className="text-[10px] text-slate-400 mt-0.5">Proprietary Enterprise Engine</p>
      </div>
    </aside>
  );
};