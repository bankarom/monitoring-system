import React, { useState } from 'react';
import { TimelineInterval, ActivityCategory } from '../types';
import { API_BASE_URL } from '../services/api';
import { formatHoursToTime } from '../utils/format';
import { ScreenshotModal } from './ScreenshotModal';
import { AddOfflineTimeModal } from './AddOfflineTimeModal';
import {
  Clock,
  Camera,
  CameraOff,
  Plus,
  History,
  MousePointer,
  Keyboard,
  Info,
  Calendar
} from 'lucide-react';

interface ActivityTimelineViewProps {
  user: {
    id: string;
    name: string;
    email: string;
    department?: string;
    shift?: string;
    status?: string;
    currentTask?: string | null;
  };
  date: string;
  attendance?: {
    clockInAt: string | null;
    clockOutAt: string | null;
    totalActiveSeconds: number;
    totalIdleSeconds: number;
    totalWorkSeconds: number;
  };
  intervals: TimelineInterval[];
  activityBlocks?: any[];
  onRefresh?: () => void;
  isAdmin?: boolean;
}

const categoryColors: Record<ActivityCategory, { bg: string; text: string; border: string; label: string }> = {
  WORK: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', label: '💼 Work' },
  COMMUNICATION: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', label: '💬 Meeting' },
  BROWSING: { bg: 'bg-sky-50', text: 'text-sky-700', border: 'border-sky-200', label: '🌐 Browsing' },
  ENTERTAINMENT: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', label: '🎬 Media' },
  IDLE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', label: '☕ Break' },
  OTHER: { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', label: '📁 Other' }
};

export const ActivityTimelineView: React.FC<ActivityTimelineViewProps> = ({
  user,
  date,
  attendance,
  intervals = [],
  activityBlocks = [],
  onRefresh,
  isAdmin = false
}) => {
  const [selectedHour, setSelectedHour] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'intervals' | 'stream'>('intervals');
  const [selectedScreenshot, setSelectedScreenshot] = useState<{
    url: string;
    title: string;
    timestamp: string;
  } | null>(null);
  const [isAddOfflineOpen, setIsAddOfflineOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');

  const hours = Array.from({ length: 24 }, (_, i) => i);

  // Group intervals by hour to populate top scrubber bar
  const hourlyActivity = hours.map((hour) => {
    const intervalsInHour = intervals.filter((inv) => {
      const invHour = new Date(inv.startTime).getHours();
      return invHour === hour;
    });

    const activeSec = intervalsInHour.reduce((sum, inv) => sum + (inv.isIdle ? 0 : inv.durationSeconds), 0);
    const breakSec = intervalsInHour.reduce((sum, inv) => sum + (inv.isIdle ? inv.durationSeconds : 0), 0);
    const hasWork = activeSec > 0;
    const hasBreak = breakSec > 0;

    return {
      hour,
      label: hour === 0 ? '12am' : hour < 12 ? `${hour}am` : hour === 12 ? '12pm' : `${hour - 12}pm`,
      activeSec,
      breakSec,
      hasWork,
      hasBreak,
      count: intervalsInHour.length
    };
  });

  // Filter intervals based on selected hour and category
  const filteredIntervals = intervals.filter((inv) => {
    const invHour = new Date(inv.startTime).getHours();
    const matchesHour = selectedHour === null || invHour === selectedHour;
    const matchesCategory = filterCategory === 'ALL' || inv.category === filterCategory;
    return matchesHour && matchesCategory;
  });

  const currentDateObj = new Date(date);
  const currentDayNum = currentDateObj.getDate();
  const year = currentDateObj.getFullYear();
  const month = currentDateObj.getMonth();
  const monthName = currentDateObj.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const activeHoursFormatted = formatHoursToTime((attendance?.totalActiveSeconds || 0) / 3600);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* 0. SCRIN.IO HORIZONTAL CALENDAR STRIP */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">{monthName}</h4>
          <span className="text-[11px] font-bold text-slate-400">All times are UTC+5.5</span>
        </div>

        <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
          {daysArray.map((dayNum) => {
            const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
            const d = new Date(year, month, dayNum);
            const dayName = d.toLocaleDateString(undefined, { weekday: 'short' });
            const isSelected = dayNum === currentDayNum;

            return (
              <button
                key={dayNum}
                onClick={() => {
                  if (onRefresh) onRefresh();
                }}
                className={`flex flex-col items-center min-w-[38px] p-1.5 rounded-xl border text-xs transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-600 text-white border-emerald-600 font-extrabold shadow-sm'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 font-medium'
                }`}
              >
                <span className="text-[9px] uppercase opacity-80">{dayName}</span>
                <span className="text-sm font-black">{dayNum}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SCRIN.IO BIG DAY STATS HEADER */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row items-center justify-between gap-6">
        <div>
          <p className="text-xs font-extrabold text-slate-400 uppercase tracking-widest">
            {currentDateObj.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
          <div className="flex items-baseline gap-3 mt-1">
            <h2 className="text-4xl font-black text-slate-900 tracking-tight">{activeHoursFormatted}</h2>
            <span className="text-xs font-bold text-slate-500">Week: {activeHoursFormatted} | Month: {activeHoursFormatted}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 border-l border-slate-100 pl-6 text-xs font-medium text-slate-600">
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Tasks & Software</span>
            <span className="font-extrabold text-slate-800">{intervals.length} Intervals Recorded</span>
          </div>
          <div>
            <span className="block text-[10px] text-slate-400 font-bold uppercase">Active Ratio</span>
            <span className="font-extrabold text-emerald-600">
              {attendance?.totalWorkSeconds ? Math.round(((attendance.totalActiveSeconds || 0) / attendance.totalWorkSeconds) * 100) : 100}%
            </span>
          </div>
        </div>
      </div>

      {/* 1. TOP SCRIN.IO 24-HOUR HORIZONTAL TIMELINE BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h3 className="text-sm font-black text-slate-900 tracking-tight">
              24-Hour Activity Bar — {new Date(date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              onClick={() => setSelectedHour(null)}
              className={`px-3 py-1 rounded-lg font-bold transition-all ${
                selectedHour === null
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Hours ({intervals.length})
            </button>
            <div className="flex items-center gap-1.5 ml-2">
              <span className="w-2.5 h-2.5 rounded bg-emerald-500" />
              <span className="text-[11px] font-semibold text-slate-600">Active Work</span>
            </div>
            <div className="flex items-center gap-1.5 ml-1">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" />
              <span className="text-[11px] font-semibold text-slate-600">Break / Idle</span>
            </div>
          </div>
        </div>

        {/* 24-Hour Interactive Segmented Scrubber Bar */}
        <div className="grid grid-cols-12 md:grid-cols-24 gap-1 p-2.5 bg-slate-50 border border-slate-200 rounded-2xl shadow-inner">
          {hourlyActivity.map((h) => {
            const isSelected = selectedHour === h.hour;
            const totalWorkMins = Math.min(60, Math.round(h.activeSec / 60));
            const totalBreakMins = Math.min(60 - totalWorkMins, Math.round(h.breakSec / 60));
            const workPct = Math.round((totalWorkMins / 60) * 100);
            const breakPct = Math.round((totalBreakMins / 60) * 100);
            const hasActivity = totalWorkMins > 0 || totalBreakMins > 0;

            return (
              <div
                key={h.hour}
                onClick={() => setSelectedHour(isSelected ? null : h.hour)}
                className={`relative flex flex-col items-center justify-between h-20 rounded-xl p-1 transition-all cursor-pointer select-none group ${
                  isSelected
                    ? 'ring-2 ring-sky-500 bg-white shadow-md'
                    : 'hover:bg-white hover:shadow-xs'
                }`}
                title={`${h.label}: ${totalWorkMins}m Active Work, ${totalBreakMins}m Break / Idle`}
              >
                <span className="text-[10px] font-black text-slate-600">{h.label}</span>

                {/* Vertical Segmented Meter */}
                <div className="w-full flex-1 max-h-10 bg-slate-200 rounded-md overflow-hidden flex flex-col-reverse relative my-1 border border-slate-300/60">
                  {hasActivity ? (
                    <>
                      <div
                        style={{ height: `${workPct}%` }}
                        className="w-full bg-emerald-500 transition-all duration-300"
                      />
                      <div
                        style={{ height: `${breakPct}%` }}
                        className="w-full bg-amber-400 transition-all duration-300"
                      />
                    </>
                  ) : (
                    <div className="w-full h-full bg-slate-200/80" />
                  )}
                </div>

                <div className="text-[9px] font-bold leading-tight text-center">
                  {totalWorkMins > 0 ? (
                    <span className="text-emerald-700 font-extrabold">{totalWorkMins}m</span>
                  ) : totalBreakMins > 0 ? (
                    <span className="text-amber-700 font-extrabold">{totalBreakMins}m</span>
                  ) : (
                    <span className="text-slate-300">—</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 2. VIEW MODE TOGGLE & ACTION CONTROLS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('intervals')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'intervals'
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            📋 Task Intervals & Screenshots ({filteredIntervals.length})
          </button>
          <button
            onClick={() => setViewMode('stream')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'stream'
                ? 'bg-white text-sky-700 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            ⚡ Live 20s Telemetry Stream ({activityBlocks.length})
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsAddOfflineOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition-all"
          >
            <Plus className="w-3.5 h-3.5" /> Add offline time
          </button>

          <button
            onClick={() => setIsHistoryOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold rounded-xl shadow-xs transition-all"
          >
            <History className="w-3.5 h-3.5 text-slate-400" /> History of changes
          </button>
        </div>
      </div>

      {viewMode === 'stream' ? (
        /* LIVE 20-SECOND TELEMETRY STREAM TABLE */
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-ping" />
              <h4 className="text-sm font-black text-slate-900">Real-Time 20-Second Activity Stream</h4>
            </div>
            <span className="text-xs font-bold text-slate-400 font-mono">Updates 3x per minute</span>
          </div>

          {activityBlocks.length === 0 ? (
            <div className="text-center py-10 text-slate-400 text-xs">
              No 20-second telemetry packets logged yet for this date.
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[500px]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase text-[10px] font-extrabold sticky top-0 z-10">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Application</th>
                    <th className="p-3">Active Window Title</th>
                    <th className="p-3">Domain</th>
                    <th className="p-3">Activity</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[...activityBlocks].reverse().slice(0, 100).map((block: any, idx: number) => {
                    const blockTime = block.recordedAt
                      ? new Date(block.recordedAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })
                      : '—';
                    return (
                      <tr key={block.id || idx} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-500">{blockTime}</td>
                        <td className="p-3 font-bold text-slate-900">{block.appName || 'Desktop'}</td>
                        <td className="p-3 text-slate-600 max-w-[320px] truncate" title={block.windowTitle}>
                          {block.windowTitle || '—'}
                        </td>
                        <td className="p-3 text-sky-700 font-semibold">{block.domain || '—'}</td>
                        <td className="p-3 font-mono text-[11px] text-slate-500">
                          {block.mouseClicks || 0} clicks • {block.keystrokes || 0} keys
                        </td>
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                              block.isIdle
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {block.isIdle ? 'Idle' : 'Active'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        /* CATEGORY FILTER BAR & INTERVALS LIST */
        <>
          <div className="flex flex-wrap items-center gap-2">
            {['ALL', 'WORK', 'COMMUNICATION', 'BROWSING', 'IDLE'].map((cat) => (
              <button
                key={cat}
                onClick={() => setFilterCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterCategory === cat
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                {cat === 'ALL' ? 'All Activities' : categoryColors[cat as ActivityCategory]?.label || cat}
              </button>
            ))}
          </div>
      <div className="space-y-4">
        {filteredIntervals.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-xs">
            <Clock className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <h4 className="text-sm font-bold text-slate-700">No activity recorded for this period</h4>
            <p className="text-xs text-slate-400 mt-1">Start tracking from the desktop agent or add offline time above.</p>
          </div>
        ) : (
          filteredIntervals.map((inv) => {
            const catStyle = categoryColors[inv.category] || categoryColors.WORK;
            const statusDotClass = inv.isIdle
              ? 'bg-amber-500'
              : inv.isOfflineTime
              ? 'bg-sky-500'
              : 'bg-emerald-500';

            return (
              <div
                key={inv.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs hover:border-slate-300 transition-all space-y-3"
              >
                {/* Interval Header Line */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-slate-500 font-mono tracking-tight">
                      {inv.startTime ? `${new Date(inv.startTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })} - ${new Date(inv.endTime).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}` : inv.timeRangeFormatted}
                    </span>
                    <span className={`w-2 h-2 rounded-full ${statusDotClass}`} />
                    <span className="text-sm font-black text-slate-900">
                      {inv.taskName}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${catStyle.bg} ${catStyle.text} ${catStyle.border}`}
                    >
                      {catStyle.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs font-semibold text-slate-500">
                    <span>{inv.durationMinutes} min{inv.durationMinutes > 1 ? 's' : ''}</span>
                    {inv.clicks > 0 && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <MousePointer className="w-3 h-3 text-slate-400" /> {inv.clicks}
                      </span>
                    )}
                    {inv.keystrokes > 0 && (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Keyboard className="w-3 h-3 text-slate-400" /> {inv.keystrokes}
                      </span>
                    )}
                  </div>
                </div>

                {/* Screenshot / Content Block */}
                <div className="pt-1">
                  {inv.isOfflineTime ? (
                    <div className="p-3.5 rounded-xl bg-sky-50/60 border border-sky-100 flex items-start gap-2.5 text-xs text-sky-900">
                      <Calendar className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">Offline Work Logged</p>
                        <p className="text-[11px] text-sky-700 mt-0.5">{inv.comment || 'Manual activity entry'}</p>
                      </div>
                    </div>
                  ) : inv.hasScreenshot ? (
                    <div className="flex flex-wrap gap-3">
                      {inv.screenshots.map((shot) => {
                        const fullUrl = `${API_BASE_URL}${shot.filePath}`;
                        const timeStr = new Date(shot.takenAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        });

                        return (
                          <div
                            key={shot.id}
                            onClick={() =>
                              setSelectedScreenshot({
                                url: fullUrl,
                                title: `${user.name} — ${shot.taskName || shot.appName || 'Screen'}`,
                                timestamp: shot.takenAt
                              })
                            }
                            className="group relative w-48 aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden cursor-pointer shadow-xs hover:shadow-md transition-all"
                          >
                            <img
                              src={fullUrl}
                              alt={shot.appName || 'Screenshot'}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                            {/* Scrin.io-style thumbnail overlay pill */}
                            <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-slate-900/80 backdrop-blur-xs text-[10px] font-mono text-white flex items-center gap-1.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                              <span>{timeStr}</span>
                            </div>

                            <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between text-white text-[10px]">
                              <span className="truncate">{shot.appName || 'Desktop'}</span>
                              <Camera className="w-3 h-3 text-sky-400 shrink-0" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 text-xs text-slate-400 flex items-center gap-2">
                      <CameraOff className="w-4 h-4 text-slate-300" />
                      <span>Screenshots not available</span>
                    </div>
                  )}
                </div>

                {/* Comment / App Window Details */}
                {(inv.comment || inv.windowTitle) && (
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 pt-1">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">
                      {inv.comment ? `Note: ${inv.comment}` : `Active Window: ${inv.windowTitle}`}
                    </span>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
      </>
      )}

      {/* 4. LIGHTBOX SCREENSHOT MODAL */}
      {selectedScreenshot && (
        <ScreenshotModal
          isOpen={!!selectedScreenshot}
          onClose={() => setSelectedScreenshot(null)}
          imageUrl={selectedScreenshot.url}
          title={selectedScreenshot.title}
          timestamp={selectedScreenshot.timestamp}
        />
      )}

      {/* 5. ADD OFFLINE TIME MODAL */}
      <AddOfflineTimeModal
        isOpen={isAddOfflineOpen}
        onClose={() => setIsAddOfflineOpen(false)}
        onSuccess={() => onRefresh && onRefresh()}
        defaultDate={date}
        userId={isAdmin ? user.id : undefined}
      />

      {/* 6. HISTORY OF CHANGES AUDIT MODAL */}
      {isHistoryOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-sky-600" />
                <h3 className="text-sm font-bold text-slate-900">History of Changes</h3>
              </div>
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>
            <div className="p-6 space-y-3 max-h-80 overflow-y-auto text-xs text-slate-600">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                  <span>Automatic Telemetry Record</span>
                  <span className="text-[10px] text-slate-400">{date}</span>
                </div>
                <p className="text-[11px] text-slate-500">
                  {intervals.length} activity blocks recorded automatically via Improx Desktop Agent.
                </p>
              </div>
              {attendance?.clockInAt && (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                    <span>Shift Clock In</span>
                    <span className="text-[10px] text-slate-400">
                      {new Date(attendance.clockInAt).toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Employee authenticated and started work shift tracking.
                  </p>
                </div>
              )}
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsHistoryOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
