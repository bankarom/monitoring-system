import React, { useState } from 'react';
import { X, Clock, Calendar, Tag, FileText, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import { ActivityCategory } from '../types';

interface AddOfflineTimeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defaultDate?: string;
  userId?: string; // If admin is adding for a specific user
}

export const AddOfflineTimeModal: React.FC<AddOfflineTimeModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultDate,
  userId
}) => {
  const [date, setDate] = useState(defaultDate || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [taskName, setTaskName] = useState('');
  const [category, setCategory] = useState<ActivityCategory>('WORK');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskName.trim()) {
      setError('Please enter a task name / activity description');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const startDateTime = `${date}T${startTime}:00.000Z`;
      const endDateTime = `${date}T${endTime}:00.000Z`;

      if (new Date(endDateTime) <= new Date(startDateTime)) {
        setError('End time must be after start time');
        setLoading(false);
        return;
      }

      const endpoint = userId ? '/admin/offline-time' : '/employee/offline-time';
      const payload: any = {
        date,
        startTime: startDateTime,
        endTime: endDateTime,
        taskName: taskName.trim(),
        category,
        reason: reason.trim() || null
      };

      if (userId) {
        payload.userId = userId;
      }

      await api.post(endpoint, payload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to record offline time');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Add Offline Time</h3>
              <p className="text-[11px] text-slate-400 font-medium">Log meetings, client calls, or offline work</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-400" /> Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 font-medium text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Start Time</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 font-medium text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">End Time</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 font-medium text-slate-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-slate-400" /> Task / Activity Name
            </label>
            <input
              type="text"
              placeholder="e.g. Architecture Review Call, Client Demo"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 font-medium text-slate-800"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ActivityCategory)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 font-medium text-slate-800 bg-white"
            >
              <option value="WORK">💼 Work (Development / Design)</option>
              <option value="COMMUNICATION">👥 Communication (Meeting / Call)</option>
              <option value="BROWSING">🌐 Research / Browsing</option>
              <option value="OTHER">📁 Other Offline Activity</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-400" /> Notes / Justification (Optional)
            </label>
            <textarea
              rows={2}
              placeholder="Brief details about what was discussed or accomplished..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:border-sky-500 font-medium text-slate-800 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold shadow-md shadow-sky-600/20 disabled:opacity-50 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {loading ? 'Saving...' : 'Add Offline Time'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
