import { Router } from 'express';
import {
  getDashboardStats,
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getRealtimeGrid,
  getScreenshots,
  exportScreenshotsZip,
  getActivityTimeline,
  getAppAnalytics,
  getWebAnalytics,
  getYouTubeAnalytics,
  getTimesheets,
  deleteTimesheet,
  exportTimesheetsCSV,
  getSettings,
  updateSettings,
  addOfflineTimeAdmin,
  deleteOfflineTimeAdmin,
  getScrinReports,
  wipeDatabaseData
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Enforce authentication & Admin verification on all admin routes
router.use(authenticateToken, requireAdmin);

// System Reset
router.post('/system/wipe-database', wipeDatabaseData);

// Scrin Reports
router.get('/reports/scrin', getScrinReports);

// Dashboard
router.get('/dashboard', getDashboardStats);

// Employees CRUD
router.get('/employees', getEmployees);
router.post('/employees', createEmployee);
router.put('/employees/:id', updateEmployee);
router.delete('/employees/:id', deleteEmployee);

// Real-Time Grid
router.get('/realtime', getRealtimeGrid);

// Screenshots Gallery & ZIP Export
router.get('/screenshots', getScreenshots);
router.get('/screenshots/export-zip', exportScreenshotsZip);

// Activity Timeline
router.get('/timeline', getActivityTimeline);

// Analytics
router.get('/analytics/apps', getAppAnalytics);
router.get('/analytics/websites', getWebAnalytics);
router.get('/analytics/youtube', getYouTubeAnalytics);

// Offline Time Admin
router.post('/offline-time', addOfflineTimeAdmin);
router.delete('/offline-time/:id', deleteOfflineTimeAdmin);

// Timesheets & CSV Export
router.get('/timesheets', getTimesheets);
router.delete('/timesheets/:id', deleteTimesheet);
router.get('/timesheets/export-csv', exportTimesheetsCSV);

// System Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
