import { Router } from 'express';
import cookieParser from 'cookie-parser';
import {
  register,
  login,
  processNewToken,
  logout,
  me
} from '../controllers/authController.js';
import authMiddleware from '../middlewares/authMiddleware.js';

const router = Router();
router.use(cookieParser());

// Đăng ký
router.post('/auth/register', register);

// Đăng nhập
router.post('/auth/login', login);

// Refresh token
router.post('/auth/refresh-token', processNewToken);

// Logout
router.post('/auth/logout', authMiddleware, logout);

// Lấy profile hiện tại
router.get('/users/me', authMiddleware, me);

export default router;
