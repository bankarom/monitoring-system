import { API_BASE_URL } from '../services/api';

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

export function getTodayLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getScreenshotUrl(filePath?: string | null): string {
  if (!filePath) return '';
  if (filePath.startsWith('http://') || filePath.startsWith('https://') || filePath.startsWith('data:')) {
    return filePath;
  }
  const cleanPath = filePath.startsWith('/') ? filePath : `/${filePath}`;
  return `${API_BASE_URL}${cleanPath}`;
}