import User from '../models/User.js';
import {
  hashPassword,
  comparePassword,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from '../utils/auth.js';
import {
  BadRequestError,
  ConflictError,
  UnauthorizedError,
  SuccessResponse
} from '../utils/ApiResponse.js';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
};
// dangki
export async function register(req, res, next) {
  try {
    const { username, email, password } = req.body;

    // Kiểm tra trùng username/email
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      if (exists.username === username) throw new ConflictError('Username already registered');
      else throw new ConflictError('Email already registered');
    }

    // Băm mật khẩu
    const hashed = await hashPassword(password);

    // Tạo user mới (role mặc định = 'user')
    const newUser = await User.create({
      username,
      email,
      password: hashed
    });

    return new SuccessResponse({
      message: 'Register successful',
      statusCode: 201,
      data: { user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// login
export async function login(req, res, next) {
  try {
    const { username, password } = req.body;

    // Tìm user theo username
    const user = await User.findOne({ username });
    if (!user) throw new BadRequestError('Invalid credentials');

    // So sánh mật khẩu
    const valid = await comparePassword(password, user.password);
    if (!valid) throw new BadRequestError('Invalid credentials');

    // Sinh token
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Lưu refreshToken vào DB user
    user.refreshTokens.push(refreshToken);
    await user.save();

    // Set cookie refreshToken
    res.cookie('refreshToken', refreshToken, COOKIE_OPTIONS);

    // Trả về accessToken và một số thông tin cơ bản
    return new SuccessResponse({
      message: 'Login successful',
      data: {
        user: { id: user._id, username: user.username, email: user.email, role: user.role },
        accessToken
      }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

//refresh
export async function processNewToken(req, res, next) {
  try {
    // Lấy refreshToken từ cookie
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) throw new UnauthorizedError('Missing refresh token');

    // Verify refreshToken
    const payload = verifyRefreshToken(oldToken);
    const user = await User.findById(payload.id);
    if (!user) throw new UnauthorizedError('User not found');

    // Check xem token cũ có nằm trong DB không
    if (!user.refreshTokens.includes(oldToken)) {
      throw new UnauthorizedError('Invalid refresh token');
    }

    // Xoá token cũ → sinh token mới (Rotation)
    user.refreshTokens = user.refreshTokens.filter(t => t !== oldToken);
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);
    user.refreshTokens.push(newRefreshToken);
    await user.save();

    // Set lại cookie mới
    res.cookie('refreshToken', newRefreshToken, COOKIE_OPTIONS);

    return new SuccessResponse({
      message: 'Token refreshed',
      data: { accessToken: newAccessToken }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res, next) {
  try {
    const oldToken = req.cookies.refreshToken;
    if (!oldToken) throw new BadRequestError('Missing refresh token');

    // Xoá refreshToken khỏi DB
    await User.updateOne({ _id: req.user._id }, { $pull: { refreshTokens: oldToken } });

    // Xoá cookie
    res.clearCookie('refreshToken', COOKIE_OPTIONS);

    return new SuccessResponse({
      message: 'Logout successful'
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// information user
export async function me(req, res, next) {
  try {
    // req.user đã được gán bởi authMiddleware
    const user = req.user;
    return new SuccessResponse({
      message: 'Get profile successful',
      data: { user: { id: user._id, username: user.username, email: user.email, role: user.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}
