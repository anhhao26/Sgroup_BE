import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  updateMyProfile
} from '../controllers/userController.js';

const router = Router();

// GET /api/users?page=&limit=
router.get('/', authMiddleware, getAllUsers);

// GET /api/users/:id
router.get('/:id', authMiddleware, getUserById);

// POST /api/users
router.post('/', authMiddleware, createUser);

// PUT /api/users/:id
router.put('/:id', authMiddleware, updateUser);

// DELETE /api/users/:id
router.delete('/:id', authMiddleware, deleteUser);

// PUT /api/users/me
router.put('/me', authMiddleware, updateMyProfile);

export default router;
