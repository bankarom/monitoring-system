import { Router } from 'express';
import { login, logout, getProfile } from '../controllers/authController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.get('/me', authenticateToken, getProfile);

export default router;
