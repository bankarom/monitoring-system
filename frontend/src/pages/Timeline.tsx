import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Employee, ActivityBlock } from '../types';
import { TimelineBar } from '../components/TimelineBar';
import { Clock, User, Calendar, LogIn, LogOut, CheckCircle2, Coffee } from 'lucide-react';

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
    setLoading(true);
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
  }, [selectedUserId, selectedDate]);

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">24-Hour Activity Timeline</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Granular step-by-step application usage and attendance tracking</p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
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
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />
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
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <LogIn className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Clock In</p>
                <p className="text-sm font-bold text-slate-200">
                  {timelineData.attendance.clockInAt
                    ? new Date(timelineData.attendance.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Not Recorded'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <LogOut className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Clock Out</p>
                <p className="text-sm font-bold text-slate-200">
                  {timelineData.attendance.clockOutAt
                    ? new Date(timelineData.attendance.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                    : 'Active / None'}
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Active Work</p>
                <p className="text-sm font-bold text-slate-200">
                  {(timelineData.attendance.totalActiveSeconds / 3600).toFixed(2)} hrs
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <Coffee className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-slate-400">Idle Breaks</p>
                <p className="text-sm font-bold text-slate-200">
                  {(timelineData.attendance.totalIdleSeconds / 3600).toFixed(2)} hrs
                </p>
              </div>
            </div>
          </div>

          {/* Timeline Heatmap */}
          <TimelineBar activityBlocks={timelineData.activityBlocks} date={selectedDate} />

          {/* Activity Log Table */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
            <div className="px-5 py-3.5 border-b border-slate-800 font-bold text-sm text-slate-200">
              Detailed Activity Log Entries ({timelineData.activityBlocks.length})
            </div>

            <div className="overflow-x-auto max-h-96">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider sticky top-0">
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
                <tbody className="divide-y divide-slate-800/60">
                  {timelineData.activityBlocks.map((block) => (
                    <tr key={block.id} className="hover:bg-slate-800/40">
                      <td className="px-5 py-3 font-mono text-slate-400">
                        {new Date(block.recordedAt).toLocaleTimeString()}
                      </td>
                      <td className="px-5 py-3 font-bold text-slate-200">{block.appName}</td>
                      <td className="px-5 py-3 text-slate-400 max-w-xs truncate">{block.windowTitle || '—'}</td>
                      <td className="px-5 py-3">
                        <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                          {block.category}
                        </span>
                      </td>
                      <td className="px-5 py-3">{block.durationSeconds}s</td>
                      <td className="px-5 py-3 text-emerald-400 font-medium">{block.mouseClicks}</td>
                      <td className="px-5 py-3 text-amber-400 font-medium">{block.keystrokes}</td>
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