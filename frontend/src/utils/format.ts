export function formatSecondsToTime(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hrs > 0) {
    return `${hrs}h ${mins}m ${secs}s`;
  }
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

export function formatHoursToTime(hoursDecimal: number): string {
  if (!hoursDecimal || hoursDecimal <= 0) return '0s';
  const totalSeconds = Math.round(hoursDecimal * 3600);
  return formatSecondsToTime(totalSeconds);
}