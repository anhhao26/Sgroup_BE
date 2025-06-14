import UserService from '../services/UserService.js';
import { SuccessResponse } from '../utils/ApiResponse.js';

const userService = new UserService();

// GET /api/users?page=&limit=
export async function getAllUsers(req, res, next) {
  try {
    const page = req.query.page;
    const limit = req.query.limit;
    const result = await userService.getAllUsers({ page, limit });
    return new SuccessResponse({
      message: 'Get all users successfully',
      data: result
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// GET /api/users/:id
export async function getUserById(req, res, next) {
  try {
    const user = await userService.getUserById(req.params.id);
    return new SuccessResponse({
      message: 'Get user successfully',
      data: { user }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// POST /api/users
export async function createUser(req, res, next) {
  try {
    const newUser = await userService.createUser({
      ...req.body,
      requesterRole: req.user.role
    });
    return new SuccessResponse({
      message: 'User created successfully',
      statusCode: 201,
      data: { user: { id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/:id
export async function updateUser(req, res, next) {
  try {
    const updatedUser = await userService.updateUser(
      req.params.id,
      req.body,
      req.user.role
    );
    return new SuccessResponse({
      message: 'User updated successfully',
      data: { user: { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// DELETE /api/users/:id
export async function deleteUser(req, res, next) {
  try {
    await userService.deleteUser(req.params.id, req.user.role);
    return new SuccessResponse({
      message: 'User deleted successfully'
    }).send(res);
  } catch (err) {
    next(err);
  }
}

// PUT /api/users/me
export async function updateMyProfile(req, res, next) {
  try {
    const updatedUser = await userService.updateMyProfile(req.user._id, req.body);
    return new SuccessResponse({
      message: 'Profile updated successfully',
      data: { user: { id: updatedUser._id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role } }
    }).send(res);
  } catch (err) {
    next(err);
  }
}
