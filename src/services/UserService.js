import mongoose from 'mongoose';
import User from '../models/User.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError,
  ConflictError
} from '../utils/ApiResponse.js';
import { hashPassword } from '../utils/auth.js';

export default class UserService {
  /**
   * (Admin) Lấy danh sách tất cả user (có phân trang)
   */
  async getAllUsers({ page = 1, limit = 10 }) {
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [total, users] = await Promise.all([
      User.countDocuments(),
      User.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-password -refreshTokens')
    ]);
    return { total, page, limit, users };
  }

  /**
   * (Admin) Lấy thông tin 1 user theo ID
   */
  async getUserById(id) {
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid user ID');
    const user = await User.findById(id).select('-password -refreshTokens');
    if (!user) throw new NotFoundError('User not found');
    return user;
  }

  /**
   * (Admin) Tạo user mới
   */
  async createUser({ username, email, password, role, requesterRole }) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can create user');
    if (!username || !email || !password) {
      throw new BadRequestError('Username, email và password là bắt buộc');
    }
    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      if (exists.username === username) throw new ConflictError('Username already exists');
      else throw new ConflictError('Email already exists');
    }
    const hashed = await hashPassword(password);
    const user = new User({ username, email, password: hashed, role: role || 'user' });
    await user.save();
    return user;
  }

  /**
   * (Admin) Cập nhật user theo ID
   */
  async updateUser(id, { username, email, password, role }, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can update user');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid user ID');
    const user = await User.findById(id);
    if (!user) throw new NotFoundError('User not found');

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = await hashPassword(password);
    if (role) user.role = role;

    await user.save();
    return user;
  }

  /**
   * (Admin) Xóa user
   */
  async deleteUser(id, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can delete user');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid user ID');
    const user = await User.findByIdAndDelete(id);
    if (!user) throw new NotFoundError('User not found');
    return;
  }

  /**
   * (User) Cập nhật profile chính mình
   */
  async updateMyProfile(userId, { username, email, password }) {
    if (!mongoose.isValidObjectId(userId)) throw new BadRequestError('Invalid user ID');
    const user = await User.findById(userId);
    if (!user) throw new NotFoundError('User not found');

    if (username) user.username = username;
    if (email) user.email = email;
    if (password) user.password = await hashPassword(password);

    await user.save();
    return user;
  }
}
