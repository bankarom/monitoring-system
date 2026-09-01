import { Router } from 'express';
import {
  getMyProfile,
  getMyScreenshots,
  getMyTimeline,
  getMyTimesheet,
  getMyAnalytics
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

export default router;
