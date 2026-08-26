import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import { StatCard } from '../components/StatCard';
import {
  Users,
  Radio,
  Clock,
  Coffee,
  PieChart as PieIcon,
  Globe,
  TrendingUp
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard');
      setStats(res.data.stats);
    } catch (err) {
      console.error('Failed to fetch dashboard stats', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000); // 15s auto-refresh
    return () => clearInterval(interval);
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">Organization Overview</h1>
          <p className="text-xs text-slate-400 mt-1">Live productivity intelligence and attendance summary</p>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={stats.headcount.total}
          subtitle="Registered employees"
          icon={Users}
          color="indigo"
        />
        <StatCard
          title="Active Working"
          value={stats.headcount.online}
          subtitle="Currently inputting"
          icon={Radio}
          color="emerald"
          badge="Live"
        />
        <StatCard
          title="Away / Idle"
          value={stats.headcount.idle}
          subtitle="Inactive > 5 mins"
          icon={Coffee}
          color="amber"
        />
        <StatCard
          title="Total Hours Today"
          value={`${stats.todayHours.activeHours}h`}
          subtitle={`${stats.todayHours.idleHours}h idle breaks logged`}
          icon={Clock}
          color="sky"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 7-Day Trend Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-200">7-Day Productivity Curve (Hours)</h3>
            </div>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats.productivityTrend}>
                <defs>
                  <linearGradient id="activeGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0284c7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0284c7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} unit="h" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="activeHours" stroke="#0284c7" strokeWidth={2} fillOpacity={1} fill="url(#activeGrad)" name="Active Hours" />
                <Area type="monotone" dataKey="idleHours" stroke="#f59e0b" strokeWidth={2} fill="#f59e0b" fillOpacity={0.1} name="Idle Hours" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Apps Today Bar Chart */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <PieIcon className="w-5 h-5 text-sky-400" />
              <h3 className="text-sm font-bold text-slate-200">Top Software Today</h3>
            </div>

            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.topApps} layout="vertical">
                  <XAxis type="number" stroke="#64748b" fontSize={10} unit="m" />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} width={80} tickFormatter={(val) => val.length > 10 ? val.substring(0, 10) + '...' : val} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.75rem', fontSize: '12px' }}
                  />
                  <Bar dataKey="durationMinutes" fill="#0284c7" radius={[0, 4, 4, 0]} name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 mb-2 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-indigo-400" /> Top Visited Domains
            </h4>
            <div className="space-y-1.5">
              {stats.topWebsites.slice(0, 3).map((w, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800">
                  <span className="text-slate-300 font-medium truncate">{w.domain}</span>
                  <span className="text-sky-400 font-bold">{w.durationMinutes}m</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};