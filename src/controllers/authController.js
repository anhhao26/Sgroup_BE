import AuthService from '../services/AuthService.js';
import { SuccessResponse } from '../utils/ApiResponse.js';

const authService = new AuthService();

// POST /api/auth/register
export async function register(req, res, next) {
  try {
    const newUser = await authService.register(req.body);
    return new SuccessResponse({
      message: 'Register successful',
      statusCode: 201,
      data: { user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/login
export async function login(req, res, next) {
  try {
    const { user, accessToken, refreshToken } = await authService.login(req.body);
    // Đưa refreshToken vào cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
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

// POST /api/auth/refresh-token
export async function processNewToken(req, res, next) {
  try {
    const oldToken = req.cookies.refreshToken;
    const { accessToken, refreshToken: newRefreshToken } = await authService.refreshToken(oldToken);
    // Cập nhật cookie mới
    res.cookie('refreshToken', newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    return new SuccessResponse({
      message: 'Token refreshed',
      data: { accessToken }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// POST /api/auth/logout
export async function logout(req, res, next) {
  try {
    const oldToken = req.cookies.refreshToken;
    await authService.logout(req.user._id, oldToken);
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return new SuccessResponse({
      message: 'Logout successful'
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/me
export async function me(req, res, next) {
  try {
    const user = await authService.me(req.user._id);
    return new SuccessResponse({
      message: 'Get profile successful',
      data: { user: { id: user._id, username: user.username, email: user.email, role: user.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}
