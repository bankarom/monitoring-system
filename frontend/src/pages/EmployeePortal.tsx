import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { formatHoursToTime } from '../utils/format';
import { Camera, Clock, Calendar, Activity, Lock, RefreshCw, UserCheck, AppWindow, MousePointer, Keyboard } from 'lucide-react';

export const EmployeePortal: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [timesheet, setTimesheet] = useState<any>(null);
  const [screenshots, setScreenshots] = useState<any[]>([]);
  const [apps, setApps] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);

  const fetchEmployeeData = async () => {
    try {
      const [profRes, timeRes, shotRes, appRes] = await Promise.all([
        api.get('/employee/profile'),
        api.get('/employee/timesheet', { params: { date: selectedDate } }),
        api.get('/employee/screenshots', { params: { date: selectedDate } }),
        api.get('/employee/analytics', { params: { date: selectedDate } })
      ]);

      setProfile(profRes.data.user);
      setTimesheet(timeRes.data.timesheet);
      setScreenshots(shotRes.data.screenshots || []);
      setApps(appRes.data.apps || []);
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
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-sky-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">My Work Portal</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Personal Work Dashboard for <span className="font-bold text-slate-800">{profile?.name || 'Employee'}</span> ({profile?.email}) | Shift: <span className="font-bold text-sky-700">{profile?.shift || 'Standard'}</span>
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
            onClick={fetchEmployeeData}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 text-sky-600 mb-2">
            <Clock className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Active Work</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatHoursToTime(timesheet?.activeHours || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Today's Active Software Time</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 text-amber-600 mb-2">
            <Activity className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Idle & Breaks</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatHoursToTime(timesheet?.idleHours || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Meetings, Breaks & Auto Idle</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <Calendar className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Shift Time</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{formatHoursToTime(timesheet?.totalHours || 0)}</p>
          <p className="text-[11px] text-slate-400 mt-1">Clock In: {timesheet?.clockInAt ? new Date(timesheet.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-3 text-purple-600 mb-2">
            <Lock className="w-5 h-5" />
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Productivity Score</span>
          </div>
          <p className="text-2xl font-black text-slate-900">{timesheet?.productivityScore || 0}%</p>
          <p className="text-[11px] text-slate-400 mt-1">Active vs. Shift Ratio</p>
        </div>
      </div>

      {/* Top Apps & Input Activity */}
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

      {/* Screenshots Section */}
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
            {screenshots.map((s) => (
              <div key={s.id} className="group relative bg-slate-900 rounded-xl overflow-hidden border border-slate-200">
                <img
                  src={s.filePath}
                  alt={s.appName || 'Screenshot'}
                  className="w-full h-36 object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-90 p-3 flex flex-col justify-end">
                  <p className="text-xs font-bold text-white truncate">{s.appName || 'Desktop'}</p>
                  <p className="text-[10px] text-slate-300 truncate">{s.windowTitle}</p>
                  <p className="text-[9px] text-sky-400 font-mono mt-1">
                    {new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
