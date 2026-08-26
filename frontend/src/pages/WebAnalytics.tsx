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
            <Globe className="w-5 h-5 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Web Browsing History</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Aggregated domain visits and web productivity distribution</p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
          />

          <button
            onClick={fetchWebAnalytics}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
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
        <div className="p-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs">
          No web browsing activity recorded for this date.
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
              <tr>
                <th className="px-5 py-3.5">Web Domain</th>
                <th className="px-5 py-3.5">Total Time Spent</th>
                <th className="px-5 py-3.5">Browsing Share</th>
                <th className="px-5 py-3.5">Visits Count</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {websites.map((web, index) => (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>{web.domain}</span>
                    <a
                      href={`https://${web.domain}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-slate-400 hover:text-slate-700 ml-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </td>
                  <td className="px-5 py-3.5 font-extrabold text-slate-900">
                    {web.totalHours > 0 ? `${web.totalHours} hrs` : `${web.totalMinutes} mins`}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-indigo-500 h-full rounded-full"
                          style={{ width: `${Math.min(web.percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-[11px] font-mono font-bold text-slate-600">{web.percentage}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-800 font-bold">{web.visitCount}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};