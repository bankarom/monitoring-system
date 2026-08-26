import React, { useEffect, useState } from 'react';
import { api, API_BASE_URL } from '../services/api';
import { ScreenshotItem, Employee } from '../types';
import { ScreenshotModal } from '../components/ScreenshotModal';
import { Image as ImageIcon, Download, User, RefreshCw, AppWindow } from 'lucide-react';

export const Screenshots: React.FC = () => {
  const [screenshots, setScreenshots] = useState<ScreenshotItem[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [activeModalIndex, setActiveModalIndex] = useState<number | null>(null);

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/admin/employees');
      setEmployees(res.data.employees);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchScreenshots = async () => {
    setLoading(true);
    try {
      const params: any = { date: selectedDate };
      if (selectedUserId) params.userId = selectedUserId;

      const res = await api.get('/admin/screenshots', { params });
      setScreenshots(res.data.screenshots);
    } catch (err) {
      console.error('Failed to fetch screenshots', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchScreenshots();
  }, [selectedUserId, selectedDate]);

  const handleDownloadZip = () => {
    let url = `${API_BASE_URL}/api/admin/screenshots/export-zip?date=${selectedDate}`;
    if (selectedUserId) url += `&userId=${selectedUserId}`;
    window.open(url, '_blank');
  };

  const currentModalScreenshot = activeModalIndex !== null ? screenshots[activeModalIndex] : null;

  return (
    <div className="space-y-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-sky-600" />
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Screenshots Gallery</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">Multi-monitor screen captures taken automatically every 10 minutes</p>
        </div>

        {/* Filters & Export */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <select
              value={selectedUserId}
              onChange={(e) => setSelectedUserId(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
            >
              <option value="">All Employees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name} ({e.department})
                </option>
              ))}
            </select>
          </div>

          <div className="relative flex items-center">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-white border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-800 font-medium focus:outline-none focus:border-sky-500 shadow-xs"
            />
          </div>

          <button
            onClick={handleDownloadZip}
            disabled={screenshots.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 disabled:opacity-50 transition-all"
          >
            <Download className="w-4 h-4" /> Download All (ZIP)
          </button>

          <button
            onClick={fetchScreenshots}
            className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-colors shadow-xs"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Gallery Grid */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : screenshots.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
          <ImageIcon className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-700">No screenshots found</h3>
          <p className="text-xs text-slate-400 mt-1">Try selecting a different date or employee.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {screenshots.map((s, index) => {
            const fullUrl = `${API_BASE_URL}${s.filePath}`;
            return (
              <div
                key={s.id}
                onClick={() => setActiveModalIndex(index)}
                className="group bg-white border border-slate-200 rounded-2xl overflow-hidden cursor-pointer hover:border-sky-400 hover:shadow-lg transition-all flex flex-col justify-between shadow-xs"
              >
                <div className="relative aspect-video bg-slate-100 overflow-hidden">
                  <img
                    src={fullUrl}
                    alt={s.appName || 'Screen capture'}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur text-[10px] font-mono text-white">
                    {new Date(s.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="p-3 bg-white border-t border-slate-100">
                  <p className="text-xs font-bold text-slate-900 truncate flex items-center gap-1.5">
                    <User className="w-3 h-3 text-sky-600 shrink-0" />
                    {s.user.name}
                  </p>
                  <p className="text-[11px] text-slate-500 truncate mt-1 flex items-center gap-1.5 font-medium">
                    <AppWindow className="w-3 h-3 text-slate-400 shrink-0" />
                    {s.appName || 'Desktop'}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox Modal */}
      {currentModalScreenshot && (
        <ScreenshotModal
          isOpen={activeModalIndex !== null}
          onClose={() => setActiveModalIndex(null)}
          imageUrl={`${API_BASE_URL}${currentModalScreenshot.filePath}`}
          title={`${currentModalScreenshot.user.name} — ${currentModalScreenshot.appName || 'Desktop'}`}
          timestamp={currentModalScreenshot.takenAt}
          onPrev={() => setActiveModalIndex((prev) => (prev !== null && prev > 0 ? prev - 1 : prev))}
          onNext={() => setActiveModalIndex((prev) => (prev !== null && prev < screenshots.length - 1 ? prev + 1 : prev))}
          hasPrev={activeModalIndex !== null && activeModalIndex > 0}
          hasNext={activeModalIndex !== null && activeModalIndex < screenshots.length - 1}
        />
      )}
    </div>
  );
};