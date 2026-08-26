import React from 'react';
import { RealtimeEmployee } from '../types';
import { API_BASE_URL } from '../services/api';
import { Monitor, MousePointer, Keyboard, Clock, Globe, AppWindow, Maximize2 } from 'lucide-react';

interface LiveEmployeeCardProps {
  employee: RealtimeEmployee;
  onViewScreenshot: (screenshotUrl: string, title: string, timestamp: string) => void;
}

export const LiveEmployeeCard: React.FC<LiveEmployeeCardProps> = ({ employee, onViewScreenshot }) => {
  const statusColor =
    employee.status === 'ONLINE'
      ? 'bg-emerald-500 text-emerald-400 border-emerald-500/30'
      : employee.status === 'IDLE'
      ? 'bg-amber-500 text-amber-400 border-amber-500/30'
      : 'bg-rose-500 text-rose-400 border-rose-500/30';

  const fullScreenshotUrl = employee.latestScreenshot
    ? `${API_BASE_URL}${employee.latestScreenshot.filePath}`
    : null;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all shadow-lg hover:shadow-sky-500/5 group">
      {/* Top Header */}
      <div>
        <div className="flex items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-sm text-sky-400">
              {employee.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100 leading-tight group-hover:text-sky-400 transition-colors">
                {employee.name}
              </h4>
              <p className="text-[11px] text-slate-400">{employee.department}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold">
            <span className={`w-2 h-2 rounded-full ${statusColor.split(' ')[0]} ${employee.status === 'ONLINE' ? 'animate-ping' : ''}`} />
            <span className={statusColor.split(' ')[1]}>{employee.status}</span>
          </div>
        </div>

        {/* Screenshot Preview */}
        <div className="relative w-full aspect-video rounded-xl bg-slate-950 border border-slate-800 overflow-hidden mb-3.5 flex items-center justify-center group/screen">
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
                className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover/screen:opacity-100 flex items-center justify-center gap-2 text-xs font-semibold text-white transition-opacity backdrop-blur-[2px]"
              >
                <Maximize2 className="w-4 h-4 text-sky-400" /> View Fullscreen
              </button>
            </>
          ) : (
            <div className="text-center p-4">
              <Monitor className="w-8 h-8 text-slate-700 mx-auto mb-1.5" />
              <p className="text-xs text-slate-400 font-medium">Awaiting first capture...</p>
            </div>
          )}
        </div>

        {/* Current Active Window & Domain */}
        <div className="space-y-2 text-xs mb-3">
          <div className="flex items-center gap-2 text-slate-300 bg-slate-950/60 px-2.5 py-1.5 rounded-lg border border-slate-800/80">
            <AppWindow className="w-3.5 h-3.5 text-sky-400 shrink-0" />
            <span className="truncate font-medium">{employee.currentApp || 'Desktop'}</span>
          </div>

          {employee.currentDomain && (
            <div className="flex items-center gap-2 text-slate-400 bg-slate-950/40 px-2.5 py-1.5 rounded-lg border border-slate-800/60">
              <Globe className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
              <span className="truncate">{employee.currentDomain}</span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Metrics */}
      <div className="pt-3 border-t border-slate-800 grid grid-cols-3 gap-2 text-[11px] text-slate-400">
        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Clock className="w-3 h-3 text-sky-400" /> Today
          </span>
          <span className="font-bold text-slate-200">{employee.activeHoursToday}h</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <MousePointer className="w-3 h-3 text-emerald-400" /> Clicks
          </span>
          <span className="font-bold text-slate-200">{employee.clicksPerMinute || 0}/m</span>
        </div>

        <div className="flex flex-col">
          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
            <Keyboard className="w-3 h-3 text-amber-400" /> Keys
          </span>
          <span className="font-bold text-slate-200">{employee.keysPerMinute || 0}/m</span>
        </div>
      </div>
    </div>
  );
};