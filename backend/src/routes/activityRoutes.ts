import { Router } from 'express';
import { uploadActivityBatch, uploadScreenshotHandler } from '../controllers/activityController';
import { authenticateToken } from '../middleware/auth';
import { uploadScreenshot } from '../middleware/upload';

const router = Router();

router.post('/upload', authenticateToken, uploadActivityBatch);
router.post('/screenshots/upload', authenticateToken, uploadScreenshot.single('image'), uploadScreenshotHandler);

export default router;
