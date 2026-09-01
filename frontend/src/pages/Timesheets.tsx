import React, { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../services/api';
import { TimesheetRecord } from '../types';
import { formatHoursToTime } from '../utils/format';
import { CalendarCheck, Download, RefreshCw, Trash2 } from 'lucide-react';

export const Timesheets: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimesheets = async () => {
    try {
      const res = await api.get('/admin/timesheets', {
        params: { date: selectedDate }
      });
      setTimesheets(res.data.timesheets);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTimesheets();
    const interval = setInterval(fetchTimesheets, 10000);
    return () => clearInterval(interval);
  }, [selectedDate]);

  const handleExportCSV = () => {
    const url = `${API_BASE_URL}/api/admin/timesheets/export-csv?date=${selectedDate}`;
    window.open(url, '_blank');
  };

  const handleDeleteTimesheet = async (id: string, employeeName: string) => {
    if (!window.confirm(`Are you sure you want to delete this timesheet entry for ${employeeName}?`)) return;
    try {
      await api.delete(`/admin/timesheets/${id}`);
      fetchTimesheets();
    } catch (err) {
      console.error('Failed to delete timesheet', err);
    }
  };

  const filtered = timesheets.filter(
    (t) =>
      t.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.employeeEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Timesheets & Attendance</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Official daily clock-in/out timestamps, hours, and payroll exports (Auto-refreshes every 10s)</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
          />

          <button
            onClick={handleExportCSV}
            disabled={timesheets.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV / Payroll
          </button>

          <button
            onClick={fetchTimesheets}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">No timesheets recorded for this date.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Shift</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Active Work</th>
                  <th className="px-5 py-3.5">Idle Breaks</th>
                  <th className="px-5 py-3.5">Pause / Activity</th>
                  <th className="px-5 py-3.5">Total Time</th>
                  <th className="px-5 py-3.5">Productivity</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50">
                    <td className="px-5 py-3.5 font-bold text-slate-900">{t.employeeName}</td>
                    <td className="px-5 py-3.5 text-slate-600 font-medium">{t.department}</td>
                    <td className="px-5 py-3.5 text-slate-500 font-medium">{t.shift}</td>
                    <td className="px-5 py-3.5 font-mono font-bold text-emerald-700">
                      {t.clockInAt ? new Date(t.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono font-bold text-rose-700">
                      {t.clockOutAt ? new Date(t.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                    </td>
                    <td className="px-5 py-3.5 font-black text-slate-900">{formatHoursToTime(t.activeHours)}</td>
                    <td className="px-5 py-3.5 text-amber-700 font-bold">{formatHoursToTime(t.idleHours)}</td>
                    <td className="px-5 py-3.5">
                      {(t as any).pauseReason ? (
                        <span className="px-2.5 py-1 rounded-lg text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                          {(t as any).pauseReason}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-medium">—</span>
                      )}
                    </td>
                    <td className="px-5 py-3.5 font-black text-sky-700">{formatHoursToTime(t.totalHours)}</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        {t.productivityScore}%
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDeleteTimesheet(t.id, t.employeeName)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Timesheet Entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};