import React from 'react';

export interface DonutDataItem {
  name: string;
  minutes: number;
  percentage: number;
  color: string;
}

interface DonutChartProps {
  data: DonutDataItem[];
  totalDurationFormatted: string;
  totalPercentageFormatted: string;
}

export const DonutChart: React.FC<DonutChartProps> = ({
  data,
  totalDurationFormatted,
  totalPercentageFormatted
}) => {
  if (!data || data.length === 0) {
    return (
      <div className="p-8 text-center text-slate-400 text-xs font-medium">
        No application usage data available to generate donut chart.
      </div>
    );
  }

  // Calculate SVG Pie / Donut SVG strokes
  let accumulatedAngle = 0;

  const slices = data.map((item) => {
    const angle = (item.percentage / 100) * 360;
    const startAngle = accumulatedAngle;
    accumulatedAngle += angle;
    return {
      ...item,
      startAngle,
      angle
    };
  });

  return (
    <div className="flex flex-col md:flex-row items-center justify-center gap-8 p-4">
      {/* SVG Donut Chart */}
      <div className="relative w-64 h-64 shrink-0 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
          {slices.map((slice, idx) => {
            const strokeDasharray = `${(slice.percentage * 282.7) / 100} 282.7`;
            const strokeDashoffset = -((slice.startAngle * 282.7) / 360);

            return (
              <circle
                key={idx}
                cx="50"
                cy="50"
                r="45"
                fill="transparent"
                stroke={slice.color}
                strokeWidth="12"
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                className="transition-all duration-500 hover:opacity-80 cursor-pointer"
              >
                <title>{`${slice.name}: ${slice.minutes}m (${slice.percentage}%)`}</title>
              </circle>
            );
          })}
        </svg>

        {/* Center Donut Label (Scrin.io Style) */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          <span className="text-2xl font-black text-slate-900 tracking-tight">{totalDurationFormatted}</span>
          <span className="text-xs font-bold text-slate-500 mt-0.5">{totalPercentageFormatted} Active</span>
        </div>
      </div>

      {/* Scrin.io Legend Breakdown */}
      <div className="flex-1 space-y-2.5 max-h-72 overflow-y-auto pr-2">
        {data.map((item, idx) => (
          <div key={idx} className="flex items-center justify-between gap-3 text-xs p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-3 h-3 rounded-md shrink-0 shadow-xs" style={{ backgroundColor: item.color }} />
              <span className="font-bold text-slate-800 truncate">{item.name}</span>
            </div>
            <div className="flex items-center gap-3 text-right shrink-0">
              <span className="font-extrabold text-slate-900">{item.minutes} mins</span>
              <span className="w-10 text-right font-mono font-bold text-slate-500">{item.percentage}%</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
