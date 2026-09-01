import React from 'react';
import { RealtimeEmployee } from '../types';
import { API_BASE_URL } from '../services/api';
import { formatHoursToTime } from '../utils/format';
import { Monitor, MousePointer, Keyboard, Clock, Globe, AppWindow, Maximize2 } from 'lucide-react';

interface LiveEmployeeCardProps {
  employee: RealtimeEmployee;
  onViewScreenshot: (screenshotUrl: string, title: string, timestamp: string) => void;
}

export const LiveEmployeeCard: React.FC<LiveEmployeeCardProps> = ({ employee, onViewScreenshot }) => {
  const statusColor =
    employee.status === 'ONLINE'
      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
      : employee.status === 'IDLE'
      ? 'bg-amber-50 text-amber-700 border-amber-300'
      : employee.status === 'PAUSED'
      ? 'bg-amber-100 text-amber-800 border-amber-400 font-extrabold'
      : 'bg-rose-50 text-rose-700 border-rose-300';

  const dotColor =
    employee.status === 'ONLINE'
      ? 'bg-emerald-500'
      : employee.status === 'IDLE' || employee.status === 'PAUSED'
      ? 'bg-amber-500'
      : 'bg-rose-500';

  const fullScreenshotUrl = employee.latestScreenshot
    ? `${API_BASE_URL}${employee.latestScreenshot.filePath}`
    : null;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col justify-between hover:border-sky-300 transition-all shadow-xs hover:shadow-md group">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center font-extrabold text-sm text-sky-700 shadow-xs">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 leading-tight group-hover:text-sky-600 transition-colors">
                {employee.name}
              </h4>
              <p className="text-[11px] text-slate-500 font-medium">{employee.department}</p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${statusColor}`}>
            <span className={`w-2 h-2 rounded-full ${dotColor} ${employee.status === 'ONLINE' ? 'animate-ping' : ''}`} />
            <span>
              {employee.status === 'PAUSED'
                ? `PAUSED: ${(employee as any).pauseReason || 'Break'} ${(employee as any).pauseComment ? `("${(employee as any).pauseComment}")` : ''}`
                : employee.status === 'ONLINE'
                ? 'WORKING'
                : employee.status}
            </span>
          </div>
        </div>

        {/* Screenshot Preview */}
        <div className="relative w-full aspect-video rounded-xl bg-slate-100 border border-slate-200 overflow-hidden mb-3.5 flex items-center justify-center group/screen">
          {fullScreenshotUrl ? (
            <>
              <img
                src={fullScreenshotUrl}
                alt="Latest screen capture"
                className="w-full h-full object-cover object-top transition-transform duration-300 group-hover/screen:scale-105"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <button
                onClick={() =>
                  onViewScreenshot(
                    fullScreenshotUrl,
                    `${employee.name} — ${employee.currentApp}`,
                    employee.latestScreenshot?.takenAt || new Date().toISOString()
                  )
                }
                className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover/screen:opacity-100 flex items-center justify-center gap-2 text-xs font-bold text-white transition-opacity backdrop-blur-xs"
              >
                <Maximize2 className="w-4 h-4 text-sky-400" /> View Fullscreen
              </button>
            </>
          ) : (
            <div className="text-center p-4">
              <Monitor className="w-8 h-8 text-slate-400 mx-auto mb-1.5" />
              <p className="text-xs text-slate-500 font-medium">Capturing screen...</p>
            </div>
          )}
        </div>

        {/* Current Active Window & Domain */}
        <div className="space-y-2 text-xs mb-3">
          <div className="flex items-center gap-2 text-slate-800 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
            <AppWindow className="w-3.5 h-3.5 text-sky-600 shrink-0" />
            <span className="truncate font-semibold">{employee.currentApp || 'Desktop'}</span>
          </div>

          {employee.currentDomain && (
            <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
              <Globe className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span className="truncate font-medium">{employee.currentDomain}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-[11px] text-slate-500">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-600" /> Today
          </span>
          <span className="font-extrabold text-slate-800">{formatHoursToTime(employee.activeHoursToday)}</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <MousePointer className="w-3 h-3 text-emerald-600" /> Clicks
          </span>
          <span className="font-extrabold text-slate-800">{employee.clicksPerMinute || 0}/m</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Keyboard className="w-3 h-3 text-amber-600" /> Keys
          </span>
          <span className="font-extrabold text-slate-800">{employee.keysPerMinute || 0}/m</span>
        </div>
      </div>
    </div>
  );
};