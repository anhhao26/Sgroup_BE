import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { BadRequestError } from './ApiResponse.js';

const SALT_ROUNDS = 10;

// Hash mật khẩu
export async function hashPassword(password) {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// So sánh mật khẩu
export async function comparePassword(plainText, hashed) {
  return await bcrypt.compare(plainText, hashed);
}

// Tạo Access Token
export function signAccessToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_ACCESS_SECRET, { expiresIn: '15m' });
}

// Tạo Refresh Token
export function signRefreshToken(userId) {
  return jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: '7d' });
}

// Verify Access Token
export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_ACCESS_SECRET);
  } catch (err) {
    throw new BadRequestError('Invalid or expired access token');
  }
}

// Verify Refresh Token
export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
  } catch (err) {
    throw new BadRequestError('Invalid or expired refresh token');
  }
}
