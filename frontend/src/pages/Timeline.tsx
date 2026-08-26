import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Employee, ActivityBlock } from '../types';
import { TimelineBar } from '../components/TimelineBar';
import { formatSecondsToTime } from '../utils/format';
import { Clock, LogIn, LogOut, CheckCircle2, Coffee, RefreshCw } from 'lucide-react';

export const Timeline: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [timelineData, setTimelineData] = useState<{
    user: any;
    attendance: any;
    activityBlocks: ActivityBlock[];
    screenshots: any[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/employees').then((res) => {
      setEmployees(res.data.employees);
      if (res.data.employees.length > 0) {
        setSelectedUserId(res.data.employees[0].id);
      }
    });
  }, []);

  const fetchTimeline = async () => {
    if (!selectedUserId) return;
    try {
      const res = await api.get('/admin/timeline', {
        params: { userId: selectedUserId, date: selectedDate }
      });
      setTimelineData(res.data);
    } catch (err) {
      console.error('Failed to fetch timeline', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimeline();
    const interval = setInterval(fetchTimeline, 10000);
    return () => clearInterval(interval);
  }, [selectedUserId, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">24-Hour Activity Timeline</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Granular step-by-step application usage and attendance tracking (Auto-refreshes every 10s)</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
          >
            {employees.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} ({e.department})
              </option>
            ))}
          </select>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
          />

          <button
            onClick={fetchTimeline}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading || !timelineData ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Attendance Summary Strip */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Clock In</p>
                <p className="text-sm font-black text-slate-900">
                  {timelineData.attendance.clockInAt
                    ? new Date(timelineData.attendance.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Not Recorded'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Clock Out</p>
                <p className="text-sm font-black text-slate-900">
                  {timelineData.attendance.clockOutAt
                    ? new Date(timelineData.attendance.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active / None'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Active Work</p>
                <p className="text-sm font-black text-slate-900">
                  {formatSecondsToTime(timelineData.attendance.totalActiveSeconds)}
                </p>
              </div>
            </div>

            <div className="p-4 bg-white border border-slate-200 rounded-2xl flex items-center gap-3 shadow-xs">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Idle Breaks</p>
                <p className="text-sm font-black text-slate-900">
                  {formatSecondsToTime(timelineData.attendance.totalIdleSeconds)}
                </p>
              </div>
            </div>
          </div>

          <TimelineBar activityBlocks={timelineData.activityBlocks} date={selectedDate} />

          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
            <div className="px-5 py-3.5 border-b border-slate-100 font-bold text-sm text-slate-900 bg-slate-50 flex items-center justify-between">
              <span>Detailed Activity Log Entries ({timelineData.activityBlocks.length})</span>
              <span className="text-xs text-slate-500 font-normal">Real-time Windows process tracking</span>
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider sticky top-0">
                  <tr>
                    <th className="px-5 py-3">Time</th>
                    <th className="px-5 py-3">Application</th>
                    <th className="px-5 py-3">Window Title</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3">Duration</th>
                    <th className="px-5 py-3">Clicks</th>
                    <th className="px-5 py-3">Keys</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {timelineData.activityBlocks.map((block) => (
                    <tr key={block.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-mono text-slate-500">
                        {new Date(block.recordedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-900">{block.appName}</td>
                      <td className="px-5 py-3 text-slate-500 max-w-xs truncate">{block.windowTitle || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                          {block.category}
                        </span>
                      </td>
                      <td className="px-5 py-3 font-medium">{formatSecondsToTime(block.durationSeconds)}</td>
                      <td className="px-5 py-3 text-emerald-600 font-bold">{block.mouseClicks}</td>
                      <td className="px-5 py-3 text-amber-600 font-bold">{block.keystrokes}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};