import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { AppAnalyticsItem } from '../types';
import { PieChart, Calendar, RefreshCw, Layers, MousePointer, Keyboard } from 'lucide-react';

export const AppAnalytics: React.FC = () => {
  const [apps, setApps] = useState<AppAnalyticsItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchAppAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics/apps', {
        params: { date: selectedDate }
      });
      setApps(res.data.apps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppAnalytics();
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Application Usage Analytics</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Breakdown of software tools utilized across the team</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={fetchAppAnalytics}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : apps.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          No application logs recorded for this date.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Software Name</th>
                <th className="px-5 py-3.5">Category</th>
                <th className="px-5 py-3.5">Total Time</th>
                <th className="px-5 py-3.5">Share of Workday</th>
                <th className="px-5 py-3.5">Clicks</th>
                <th className="px-5 py-3.5">Keystrokes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {apps.map((app, index) => (
                <tr key={index} className="hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-bold text-slate-100 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-sky-400 shrink-0" />
                    {app.appName}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                      {app.category}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-200">
                    {app.totalHours > 0 ? `${app.totalHours} hrs` : `${app.totalMinutes} mins`}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-sky-500 h-full rounded-full"
                          style={{ width: `${Math.min(app.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{app.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-emerald-400 font-semibold">{app.clicks}</td>
                  <td className="px-5 py-3.5 text-amber-400 font-semibold">{app.keystrokes}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};