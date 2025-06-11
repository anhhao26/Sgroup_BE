import { verifyAccessToken } from '../utils/auth.js';
import User from '../models/User.js';
import { UnauthorizedError } from '../utils/ApiResponse.js';

export default async function authMiddleware(req, res, next) {
  try {
    // Lấy token từ header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Missing Authorization header');
    }
    const token = authHeader.split(' ')[1];
    // Verify token
    const payload = verifyAccessToken(token);
    // Lấy user từ DB (loại bỏ password, refreshTokens)
    const user = await User.findById(payload.id).select('-password -refreshTokens');
    if (!user) {
      throw new UnauthorizedError('User not found');
    }
    // Đính user vào req để controllers dùng tiếp
    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
