import React, { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../services/api';
import { TimesheetRecord } from '../types';
import { CalendarCheck, Download, Search, RefreshCw, LogIn, LogOut } from 'lucide-react';

export const Timesheets: React.FC = () => {
  const [timesheets, setTimesheets] = useState<TimesheetRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchTimesheets = async () => {
    setLoading(true);
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
  }, [selectedDate]);

  const handleExportCSV = () => {
    const url = `${API_BASE_URL}/api/admin/timesheets/export-csv?date=${selectedDate}`;
    window.open(url, '_blank');
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
            <CalendarCheck className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Timesheets & Attendance</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Official daily clock-in/out timestamps, hours, and payroll exports</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          />

          <button
            onClick={handleExportCSV}
            disabled={timesheets.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" /> Export CSV / Payroll
          </button>

          <button
            onClick={fetchTimesheets}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No timesheets recorded for this date.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Shift</th>
                  <th className="px-5 py-3.5">Clock In</th>
                  <th className="px-5 py-3.5">Clock Out</th>
                  <th className="px-5 py-3.5">Active Hrs</th>
                  <th className="px-5 py-3.5">Idle Hrs</th>
                  <th className="px-5 py-3.5">Total Hrs</th>
                  <th className="px-5 py-3.5">Productivity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-800/40">
                    <td className="px-5 py-3.5 font-bold text-slate-100">{t.employeeName}</td>
                    <td className="px-5 py-3.5 text-slate-400">{t.department}</td>
                    <td className="px-5 py-3.5 text-slate-400">{t.shift}</td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400">
                      {t.clockInAt ? new Date(t.clockInAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-5 py-3.5 font-mono text-rose-400">
                      {t.clockOutAt ? new Date(t.clockOutAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Active'}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-200">{t.activeHours}h</td>
                    <td className="px-5 py-3.5 text-amber-400">{t.idleHours}h</td>
                    <td className="px-5 py-3.5 font-bold text-sky-400">{t.totalHours}h</td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-0.5 rounded-full font-bold bg-sky-500/10 text-sky-400 border border-sky-500/30">
                        {t.productivityScore}%
                      </span>
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