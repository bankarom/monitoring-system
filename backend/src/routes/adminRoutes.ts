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
  getTimesheets,
  exportTimesheetsCSV,
  getSettings,
  updateSettings
} from '../controllers/adminController';
import { authenticateToken, requireAdmin } from '../middleware/auth';

const router = Router();

// Enforce authentication & Admin verification on all admin routes
router.use(authenticateToken, requireAdmin);

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

// Timesheets & CSV Export
router.get('/timesheets', getTimesheets);
router.get('/timesheets/export-csv', exportTimesheetsCSV);

// System Settings
router.get('/settings', getSettings);
router.put('/settings', updateSettings);

export default router;
