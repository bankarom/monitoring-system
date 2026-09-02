import React, { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../services/api';
import { formatHoursToTime } from '../utils/format';
import { ScrinTimelineView } from '../components/ScrinTimelineView';
import { ScreenshotModal } from '../components/ScreenshotModal';
import { TimelineInterval, YouTubeVideoRecord } from '../types';
import {
  Camera,
  Clock,
  Calendar,
  Activity,
  Lock,
  RefreshCw,
  UserCheck,
  AppWindow,
  MousePointer,
  Keyboard,
  Youtube,
  Globe,
  Tag
} from 'lucide-react';

export const EmployeePortal: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timesheet, setTimesheet] = useState<any>(null);
  const [intervals, setIntervals] = useState<TimelineInterval[]>([]);
  const [attendance, setAttendance] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [youtubeVideos, setYoutubeVideos] = useState<YouTubeVideoRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeTab, setActiveTab] = useState<'timeline' | 'youtube' | 'apps' | 'screenshots'>('timeline');
  const [loading, setLoading] = useState(true);
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    url: string;
    title: string;
    timestamp: string;
  } | null>(null);

  const [scrinReports, setScrinReports] = useState<{ detailedRows: any[]; appsAndUrls: any[] }>({ detailedRows: [], appsAndUrls: [] });

  const fetchEmployeeData = async () => {
    try {
      const [profRes, timeRes, timelineRes, shotRes, appRes, ytRes, scrinRes] = await Promise.all([
        api.get('/employee/profile'),
        api.get('/employee/timesheet', { params: { date: selectedDate } }),
        api.get('/employee/timeline', { params: { date: selectedDate } }),
        api.get('/employee/screenshots', { params: { date: selectedDate } }),
        api.get('/employee/analytics', { params: { date: selectedDate } }),
        api.get('/employee/youtube', { params: { date: selectedDate } }),
        api.get('/employee/reports/scrin', { params: { date: selectedDate } })
      ]);

      setProfile(profRes.data.user);
      setTimesheet(timeRes.data.timesheet);
      setIntervals(timelineRes.data.intervals || []);
      setAttendance(timelineRes.data.attendance || null);
      setScreenshots(shotRes.data.screenshots || []);
      setApps(appRes.data.apps || []);
      setYoutubeVideos(ytRes.data.videos || []);
      setScrinReports({
        detailedRows: scrinRes.data.detailedRows || [],
        appsAndUrls: scrinRes.data.appsAndUrls || []
      });
    } catch (err) {
      console.error('Failed to fetch employee portal data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployeeData();
    const interval = setInterval(fetchEmployeeData, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 1. TOP EMPLOYEE WORKSPACE HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white font-black text-xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'E'}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {profile?.name || 'Employee Workspace'}
                </h1>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  {profile?.status || 'ONLINE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium flex flex-wrap items-center gap-2">
                <span>{profile?.email}</span>
                <span>•</span>
                <span>Shift: <strong className="text-slate-700">{profile?.shift || '10:00 AM - 7:00 PM'}</strong></span>
                {profile?.currentTask && (
                  <>
                    <span>•</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200 font-bold">
                      💼 Task: {profile.currentTask}
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <Calendar className="w-4 h-4 text-slate-400 ml-2" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none text-xs font-bold text-slate-800 focus:outline-none pr-2"
              />
            </div>

            <button
              onClick={fetchEmployeeData}
              title="Refresh Data"
              className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl transition-colors shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overview KPI Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-6 border-t border-slate-100">
          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-emerald-600" /> Active Work
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatHoursToTime(timesheet?.activeHours || 0)}</p>
            <span className="text-[10px] text-slate-400 font-medium">Software Time Today</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Activity className="w-3.5 h-3.5 text-amber-600" /> Breaks & Idle
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatHoursToTime(timesheet?.idleHours || 0)}</p>
            <span className="text-[10px] text-slate-400 font-medium">Pause & Auto Idle</span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-sky-600" /> Total Shift
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">{formatHoursToTime(timesheet?.totalHours || 0)}</p>
            <span className="text-[10px] text-slate-400 font-medium">
              In: {timesheet?.clockInAt ? new Date(timesheet.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Lock className="w-3.5 h-3.5 text-purple-600" /> Productivity
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">{timesheet?.productivityScore || 0}%</p>
            <span className="text-[10px] text-slate-400 font-medium">Productivity Ratio</span>
          </div>
        </div>
      </div>

      {/* 2. NAVIGATION TABS */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'timeline'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" /> 24-Hour Timeline
        </button>

        <button
          onClick={() => setActiveTab('youtube')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'youtube'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Youtube className="w-4 h-4 text-rose-500" /> YouTube & Browsing ({youtubeVideos.length})
        </button>

        <button
          onClick={() => setActiveTab('apps')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'apps'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <AppWindow className="w-4 h-4" /> Software & Apps ({apps.length})
        </button>

        <button
          onClick={() => setActiveTab('screenshots')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'screenshots'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Camera className="w-4 h-4" /> Screenshots Gallery ({screenshots.length})
        </button>
      </div>

      {/* 3. TAB PANES */}

      {/* TAB 1: 24-HOUR SCRIN.IO TIMELINE */}
      {activeTab === 'timeline' && (
        <ScrinTimelineView
          user={profile || { id: '', name: 'Employee', email: '' }}
          date={selectedDate}
          attendance={attendance}
          intervals={intervals}
          onRefresh={fetchEmployeeData}
          isAdmin={false}
        />
      )}

      {/* TAB 2: YOUTUBE & BROWSING HISTORY */}
      {activeTab === 'youtube' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Youtube className="w-5 h-5 text-rose-500" />
              <h2 className="text-base font-extrabold text-slate-900">YouTube Video Titles & Media History</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{youtubeVideos.length} Videos Watched</span>
          </div>

          {youtubeVideos.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No YouTube videos watched on {selectedDate}.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">YouTube Video Title</th>
                    <th className="px-4 py-3">Duration Spent</th>
                    <th className="px-4 py-3">Visit Count</th>
                    <th className="px-4 py-3">Last Watched At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {youtubeVideos.map((v, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                          <Youtube className="w-3.5 h-3.5" />
                        </span>
                        <span className="truncate max-w-lg">{v.title}</span>
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">
                        {v.totalMinutes} min{v.totalMinutes > 1 ? 's' : ''}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{v.visitCount} times</td>
                      <td className="px-4 py-3 font-mono text-slate-500 text-[11px]">
                        {new Date(v.lastWatchedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 3: SOFTWARE & APPS */}
      {activeTab === 'apps' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AppWindow className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-extrabold text-slate-900">My Software & App Activity</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{apps.length} Apps Used Today</span>
          </div>

          {apps.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">No app activity recorded yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                  <tr>
                    <th className="px-4 py-3">Software / Application</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Time Spent</th>
                    <th className="px-4 py-3">Mouse Clicks</th>
                    <th className="px-4 py-3">Keystrokes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {apps.map((app, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="px-4 py-3 font-bold text-slate-900 flex items-center gap-2">
                        <AppWindow className="w-4 h-4 text-sky-600" /> {app.appName}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          {app.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-black text-slate-900">{app.minutes} mins</td>
                      <td className="px-4 py-3 font-medium text-slate-600 flex items-center gap-1">
                        <MousePointer className="w-3.5 h-3.5 text-slate-400" /> {app.clicks}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">
                        <span className="flex items-center gap-1">
                          <Keyboard className="w-3.5 h-3.5 text-slate-400" /> {app.keystrokes}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* TAB 4: SCREENSHOTS GALLERY */}
      {activeTab === 'screenshots' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-sky-600" />
              <h2 className="text-base font-extrabold text-slate-900">My Captured Screenshots</h2>
            </div>
            <span className="text-xs font-bold text-slate-500">{screenshots.length} Screenshots Taken</span>
          </div>

          {screenshots.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-xs">
              No screenshots recorded for this date yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {screenshots.map((s) => {
                const fullUrl = `${API_BASE_URL}${s.filePath}`;
                return (
                  <div
                    key={s.id}
                    onClick={() =>
                      setSelectedScreenshot({
                        url: fullUrl,
                        title: `${s.taskName || s.appName || 'Desktop Screen'}`,
                        timestamp: s.takenAt
                      })
                    }
                    className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200 cursor-pointer shadow-xs hover:shadow-md transition-all"
                  >
                    <img
                      src={fullUrl}
                      alt={s.appName || 'Screenshot'}
                      className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90 p-3 flex flex-col justify-end">
                      <p className="text-xs font-bold text-white truncate">{s.taskName || s.appName || 'Desktop'}</p>
                      <p className="text-[10px] text-slate-300 truncate">{s.windowTitle}</p>
                      <p className="text-[9px] text-sky-400 font-mono mt-1">
                        {new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SCRIN.IO DETAILED REPORT TABLE */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">Scrin.io Detailed Activity Logs</h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">Granular intervals, start/stop times, and activity percentages</p>
          </div>
          <span className="text-xs font-extrabold text-slate-600 bg-slate-100 px-3 py-1 rounded-xl">
            {scrinReports.detailedRows.length} Detailed Entries
          </span>
        </div>

        {scrinReports.detailedRows.length === 0 ? (
          <div className="p-8 text-center text-slate-400 text-xs font-medium">
            No detailed activity entries recorded for this date yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Employee</th>
                  <th className="px-4 py-3">Project</th>
                  <th className="px-4 py-3">Note / Task Name</th>
                  <th className="px-4 py-3">From</th>
                  <th className="px-4 py-3">To</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Activity %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {scrinReports.detailedRows.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-slate-700">{row.date}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.employeeName}</td>
                    <td className="px-4 py-3 text-slate-500">{row.project}</td>
                    <td className="px-4 py-3 font-bold text-sky-700">{row.note}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{row.from}</td>
                    <td className="px-4 py-3 font-mono text-slate-800">{row.to}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{row.durationMinutes}m</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                        row.activityPercent > 70 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {row.activityPercent}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL */}
      {selectedScreenshot && (
        <ScreenshotModal
          isOpen={!!selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
          imageUrl={selectedScreenshot.url}
          title={selectedScreenshot.title}
          timestamp={selectedScreenshot.timestamp}
        />
      )}
    </div>
  );
};
