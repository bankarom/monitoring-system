import { Router } from 'express';
import {
  getMyProfile,
  getMyScreenshots,
  getMyTimeline,
  getMyTimesheet,
  getMyAnalytics,
  addMyOfflineTime,
  getMyOfflineTimes,
  deleteMyOfflineTime,
  getMyYouTubeHistory,
  getMyScrinReports
} from '../controllers/employeeController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Enforce authentication on all employee routes
router.use(authenticateToken);

router.get('/profile', getMyProfile);
router.get('/screenshots', getMyScreenshots);
router.get('/timeline', getMyTimeline);
router.get('/timesheet', getMyTimesheet);
router.get('/analytics', getMyAnalytics);
router.get('/youtube-history', getMyYouTubeHistory);
router.get('/reports/scrin', getMyScrinReports);

router.post('/offline-time', addMyOfflineTime);
router.get('/offline-time', getMyOfflineTimes);
router.delete('/offline-time/:id', deleteMyOfflineTime);

export default router;
