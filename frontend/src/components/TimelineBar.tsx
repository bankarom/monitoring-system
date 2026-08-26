import React from 'react';
import { ActivityBlock, ActivityCategory } from '../types';

interface TimelineBarProps {
  activityBlocks: ActivityBlock[];
  date: string;
}

const categoryColors: Record<ActivityCategory, string> = {
  WORK: 'bg-sky-500',
  COMMUNICATION: 'bg-emerald-500',
  BROWSING: 'bg-amber-500',
  ENTERTAINMENT: 'bg-purple-500',
  IDLE: 'bg-slate-400',
  OTHER: 'bg-indigo-500'
};

export const TimelineBar: React.FC<TimelineBarProps> = ({ activityBlocks }) => {
  const hours = Array.from({ length: 24 }, (_, i) => i);

  const hourlyData = hours.map((hour) => {
    const logsInHour = activityBlocks.filter((log) => {
      const logHour = new Date(log.recordedAt).getHours();
      return logHour === hour;
    });

    const totalSeconds = logsInHour.reduce((sum, l) => sum + l.durationSeconds, 0);
    const primaryLog = logsInHour[0];

    return {
      hour,
      logsCount: logsInHour.length,
      totalSeconds,
      category: primaryLog ? primaryLog.category : null,
      appName: primaryLog ? primaryLog.appName : null
    };
  });

  return (
    <div className="w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-bold text-slate-800">24-Hour Activity Heatmap</h4>
        <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-500" />
            <span className="text-slate-600">Work Apps</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" />
            <span className="text-slate-600">Communication</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            <span className="text-slate-600">Browsing</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-slate-400" />
            <span className="text-slate-600">Idle Breaks</span>
          </div>
        </div>
      </div>

      {/* Visual Bar Grid */}
      <div className="grid grid-cols-24 gap-1 h-12 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
        {hourlyData.map((slot) => {
          let bgClass = 'bg-slate-200 hover:bg-slate-300';
          if (slot.category) {
            bgClass = categoryColors[slot.category] + ' opacity-90 hover:opacity-100';
          }

          return (
            <div
              key={slot.hour}
              className={`h-full rounded-md transition-all cursor-pointer relative group ${bgClass}`}
            >
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:flex flex-col items-center bg-slate-900 text-white text-[10px] py-1 px-2.5 rounded-lg shadow-xl whitespace-nowrap z-30">
                <span className="font-bold">{String(slot.hour).padStart(2, '0')}:00 - {String(slot.hour + 1).padStart(2, '0')}:00</span>
                {slot.totalSeconds > 0 ? (
                  <span>{Math.round(slot.totalSeconds / 60)} mins ({slot.category})</span>
                ) : (
                  <span className="text-slate-400">No activity logged</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 text-[10px] font-semibold text-slate-400 mt-2 px-1">
        <span>00:00</span>
        <span>02:00</span>
        <span>04:00</span>
        <span>06:00</span>
        <span>08:00</span>
        <span>10:00</span>
        <span>12:00</span>
        <span>14:00</span>
        <span>16:00</span>
        <span>18:00</span>
        <span>20:00</span>
        <span className="text-right">23:59</span>
      </div>
    </div>
  );
};