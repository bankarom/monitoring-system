import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { WebAnalyticsItem } from '../types';
import { Globe, ExternalLink, RefreshCw } from 'lucide-react';

export const WebAnalytics: React.FC = () => {
  const [websites, setWebsites] = useState<WebAnalyticsItem[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchWebAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/analytics/websites', {
        params: { date: selectedDate }
      });
      setWebsites(res.data.websites);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWebAnalytics();
  }, [selectedDate]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Web Browsing History</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Aggregated domain visits and web productivity distribution</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={fetchWebAnalytics}
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
      ) : websites.length === 0 ? (
        <div className="p-12 text-center text-slate-500 text-xs bg-slate-900 border border-slate-800 rounded-2xl">
          No web browsing activity recorded for this date.
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Web Domain</th>
                <th className="px-5 py-3.5">Total Time Spent</th>
                <th className="px-5 py-3.5">Browsing Share</th>
                <th className="px-5 py-3.5">Visits Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {websites.map((web, index) => (
                <tr key={index} className="hover:bg-slate-800/40">
                  <td className="px-5 py-3.5 font-bold text-slate-100 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-400 shrink-0" />
                    <span>{web.domain}</span>
                    <a
                      href={`https://${web.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-600 hover:text-slate-300 ml-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-5 py-3.5 font-bold text-slate-200">
                    {web.totalHours > 0 ? `${web.totalHours} hrs` : `${web.totalMinutes} mins`}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(web.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono text-slate-400">{web.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-300 font-semibold">{web.visitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};