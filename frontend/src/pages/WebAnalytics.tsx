import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { WebAnalyticsItem, YouTubeVideoRecord } from '../types';
import { formatHoursToTime } from '../utils/format';
import { Globe, ExternalLink, RefreshCw, Youtube, Users, Clock } from 'lucide-react';

export const WebAnalytics: React.FC = () => {
  const [websites, setWebsites] = useState<WebAnalyticsItem[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'domains' | 'youtube'>('domains');
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      const [webRes, ytRes] = await Promise.all([
        api.get('/admin/analytics/websites', { params: { date: selectedDate } }),
        api.get('/admin/youtube', { params: { date: selectedDate } })
      ]);

      setWebsites(webRes.data.websites || []);
      setYoutubeVideos(ytRes.data.videos || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Web & Media Analytics</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Aggregated website domains and YouTube video titles watched across your organization
          </p>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
          />

          <button
            onClick={fetchAnalytics}
            className="p-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('domains')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'domains'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Globe className="w-4 h-4" /> Visited Domains ({websites.length})
        </button>

        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'youtube'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Youtube className="w-4 h-4 text-rose-500" /> YouTube Video Titles ({youtubeVideos.length})
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'domains' ? (
        websites.length === 0 ? (
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
                      {formatHoursToTime(web.totalHours)}
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
        )
      ) : (
        /* YOUTUBE TAB */
        youtubeVideos.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs bg-white border border-slate-200 rounded-2xl shadow-xs">
            No YouTube video watching activity recorded for this date.
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Video Title</th>
                  <th className="px-5 py-3.5">Watched By</th>
                  <th className="px-5 py-3.5">Watch Time</th>
                  <th className="px-5 py-3.5">Visits</th>
                  <th className="px-5 py-3.5">Last Watched</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {youtubeVideos.map((yt, index) => (
                  <tr key={index} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2.5">
                      <span className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center shrink-0 border border-rose-100">
                        <Youtube className="w-4 h-4" />
                      </span>
                      <span className="max-w-md truncate">{yt.title}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700 font-medium">
                      <div className="flex flex-wrap gap-1">
                        {yt.users && yt.users.map((u, i) => (
                          <span key={i} className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold">
                            {u}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">
                      {yt.totalMinutes} min{yt.totalMinutes > 1 ? 's' : ''}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-800">{yt.visitCount} times</td>
                    <td className="px-5 py-3.5 font-mono text-[11px] text-slate-500">
                      {new Date(yt.lastWatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      )}
    </div>
  );
};