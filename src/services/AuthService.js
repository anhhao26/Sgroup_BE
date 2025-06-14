import User from '../models/User.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError
} from '../utils/ApiResponse.js';
import { hashPassword, comparePassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '../utils/auth.js';

export default class AuthService {
  /**
   * Đăng ký (role mặc định là 'user')
   */
  async register({ username, email, password }) {
    // 1. Kiểm tra trùng username/email
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      if (exists.username === username) throw new ConflictError('Username already registered');
      else throw new ConflictError('Email already registered');
    }
    // 2. Hash mật khẩu
    const hashed = await hashPassword(password);
    // 3. Tạo user mới
    const newUser = new User({ username, email, password: hashed });
    await newUser.save();
    return newUser;
  }

  /**
   * Đăng nhập
   */
  async login({ username, password }) {
    // 1. Tìm user theo username
    const user = await User.findOne({ username });
    if (!user) throw new BadRequestError('Invalid credentials');

    // 2. So sánh mật khẩu
    const valid = await comparePassword(password, user.password);
    if (!valid) throw new BadRequestError('Invalid credentials');

    // 3. Sinh token
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // 4. Lưu refreshToken vào DB user
    user.refreshTokens.push(refreshToken);
    await user.save();

    return { user, accessToken, refreshToken };
  }

  /**
   * Xử lý refresh token → trả về access token mới
   */
  async refreshToken(oldToken) {
    if (!oldToken) throw new UnauthorizedError('Missing refresh token');

    // 1. Verify refresh token
    let payload;
    try {
      payload = verifyRefreshToken(oldToken);
    } catch (err) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }

    // 2. Tìm user
    const user = await User.findById(payload.id);
    if (!user) throw new UnauthorizedError('User not found');

    // 3. Kiểm tra token có tồn tại trong DB
    if (!user.refreshTokens.includes(oldToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // 4. Xoá token cũ, sinh token mới (rotation)
    user.refreshTokens = user.refreshTokens.filter(t => t !== oldToken);
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  /**
   * Logout: Xoá refresh token khỏi DB
   */
  async logout(userId, oldToken) {
    if (!oldToken) throw new BadRequestError('Missing refresh token');
    await User.updateOne({ _id: userId }, { $pull: { refreshTokens: oldToken } });
  }

  /**
   * Lấy thông tin profile hiện tại
   */
  async me(userId) {
    const user = await User.findById(userId).select('-password -refreshTokens');
    if (!user) throw new UnauthorizedError('User not found');
    return user;
  }
}
