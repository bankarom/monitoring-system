import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { config } from '../config/environment';
import { AuthenticatedRequest } from './auth';

const storage = multer.diskStorage({
  destination: (req: AuthenticatedRequest, file, cb) => {
    const userId = req.user?.userId || 'anonymous';
    const today = new Date().toISOString().split('T')[0];
    const userDir = path.join(config.uploadDir, 'screenshots', userId, today);

    if (!fs.existsSync(userDir)) {
      fs.mkdirSync(userDir, { recursive: true });
    }

    cb(null, userDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `screen-${uniqueSuffix}${ext}`);
  }
});

export const uploadScreenshot = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per screenshot
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for screenshot capture.'));
    }
  }
});