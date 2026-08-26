export type UserRole = 'ADMIN' | 'MANAGER' | 'EMPLOYEE';
export type UserStatus = 'ONLINE' | 'IDLE' | 'OFFLINE';
export type ActivityCategory = 'WORK' | 'BROWSING' | 'COMMUNICATION' | 'ENTERTAINMENT' | 'IDLE' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  shift: string;
  status: UserStatus;
  lastActiveAt?: string;
  createdAt: string;
}

export interface Employee {
  id: string;
  name: string;
  email: string;
  department: string;
  shift: string;
  status: UserStatus;
  lastActiveAt: string | null;
  currentApp: string | null;
  currentTitle: string | null;
  currentDomain: string | null;
  clockInAt: string | null;
  clockOutAt: string | null;
  activeHoursToday: number;
  idleHoursToday: number;
  totalHoursToday: number;
  createdAt: string;
}

export interface RealtimeEmployee {
  id: string;
  name: string;
  email: string;
  department: string;
  status: UserStatus;
  lastActiveAt: string | null;
  currentApp: string;
  currentTitle: string;
  currentDomain: string;
  clockInAt: string | null;
  activeHoursToday: number;
  idleHoursToday: number;
  latestScreenshot: {
    id: string;
    filePath: string;
    takenAt: string;
    appName: string | null;
    windowTitle: string | null;
  } | null;
  clicksPerMinute?: number;
  keysPerMinute?: number;
}

export interface DashboardStats {
  headcount: {
    total: number;
    online: number;
    idle: number;
    offline: number;
  };
  todayHours: {
    activeHours: number;
    idleHours: number;
    totalHours: number;
  };
  topApps: {
    name: string;
    category: ActivityCategory;
    durationMinutes: number;
  }[];
  topWebsites: {
    domain: string;
    durationMinutes: number;
  }[];
  productivityTrend: {
    date: string;
    activeHours: number;
    idleHours: number;
  }[];
}

export interface ScreenshotItem {
  id: string;
  userId: string;
  filePath: string;
  fileSize: number;
  displayIndex: number;
  appName: string | null;
  windowTitle: string | null;
  isIdle: boolean;
  takenAt: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    department: string;
  };
}

export interface ActivityBlock {
  id: string;
  userId: string;
  appName: string;
  processName: string | null;
  windowTitle: string | null;
  domain: string | null;
  url: string | null;
  category: ActivityCategory;
  durationSeconds: number;
  mouseClicks: number;
  keystrokes: number;
  isIdle: boolean;
  recordedAt: string;
}

export interface AppAnalyticsItem {
  appName: string;
  category: ActivityCategory;
  totalMinutes: number;
  totalHours: number;
  percentage: number;
  clicks: number;
  keystrokes: number;
  sessionCount: number;
}

export interface WebAnalyticsItem {
  domain: string;
  totalMinutes: number;
  totalHours: number;
  percentage: number;
  visitCount: number;
}

export interface TimesheetRecord {
  id: string;
  employeeName: string;
  employeeEmail: string;
  department: string;
  shift: string;
  date: string;
  clockInAt: string | null;
  clockOutAt: string | null;
  activeHours: number;
  idleHours: number;
  totalHours: number;
  productivityScore: number;
  status: string;
}

export interface SystemSettings {
  id: string;
  screenshotInterval: number;
  idleThreshold: number;
  retentionDays: number;
  allowEmployeePause: boolean;
  trackDomains: boolean;
  companyName: string;
}