import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { Employee } from '../types';
import { AddEmployeeModal } from '../components/AddEmployeeModal';
import { Users, UserPlus, Search, Trash2, Clock, Mail, Building, RefreshCw } from 'lucide-react';

export const Employees: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      console.error('Failed to fetch employees', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to deactivate ${name}?`)) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee', err);
    }
  };

  const filtered = employees.filter(
    (e) =>
      e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      e.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-400" />
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Employee Directory</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">Manage employee roster, credentials, and work schedules</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search employees..."
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500 w-48 sm:w-64"
            />
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-sky-600/30 transition-all"
          >
            <UserPlus className="w-4 h-4" /> Add Employee
          </button>

          <button
            onClick={fetchEmployees}
            className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-white rounded-xl transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg">
        {loading ? (
          <div className="flex items-center justify-center p-12">
            <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-xs">No employees found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/60 text-slate-400 font-semibold border-b border-slate-800 uppercase tracking-wider">
                <tr>
                  <th className="px-5 py-3.5">Employee</th>
                  <th className="px-5 py-3.5">Department</th>
                  <th className="px-5 py-3.5">Shift</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Today's Hours</th>
                  <th className="px-5 py-3.5">Current App</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {filtered.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-5 py-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sky-400">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-100">{emp.name}</p>
                        <p className="text-[11px] text-slate-500 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-600 inline" /> {emp.email}
                        </p>
                      </div>
                    </td>

                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 border border-slate-700/60 font-medium">
                        {emp.department}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 text-slate-400">{emp.shift}</td>

                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                          emp.status === 'ONLINE'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : emp.status === 'IDLE'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {emp.status}
                      </span>
                    </td>

                    <td className="px-5 py-3.5 font-bold text-slate-200">
                      {emp.activeHoursToday}h
                    </td>

                    <td className="px-5 py-3.5 text-slate-400 truncate max-w-xs">
                      {emp.currentApp || '—'}
                    </td>

                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => handleDelete(emp.id, emp.name)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                        title="Deactivate"
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

      <AddEmployeeModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={fetchEmployees}
      />
    </div>
  );
};