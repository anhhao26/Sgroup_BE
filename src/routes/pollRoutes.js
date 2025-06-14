import { Router } from 'express';
import authMiddleware from '../middlewares/authMiddleware.js';
import {
  getAllPolls,
  getPollById,
  createPoll,
  updatePoll,
  deletePoll,
  lockPoll,
  unlockPoll,
  addOption,
  removeOption,
  vote,
  unvote
} from '../controllers/pollController.js';

const router = Router();

// GET /api/polls?page=&limit=
router.get('/', authMiddleware, getAllPolls);

// POST /api/polls  (admin)
router.post('/', authMiddleware, createPoll);

// GET /api/polls/:id
router.get('/:id', authMiddleware, getPollById);

// PUT /api/polls/:id  (admin)
router.put('/:id', authMiddleware, updatePoll);

// DELETE /api/polls/:id  (admin)
router.delete('/:id', authMiddleware, deletePoll);

// PATCH /api/polls/:id/lock  (admin)
router.patch('/:id/lock', authMiddleware, lockPoll);

// PATCH /api/polls/:id/unlock  (admin)
router.patch('/:id/unlock', authMiddleware, unlockPoll);

// POST /api/polls/:id/option  (admin)
router.post('/:id/option', authMiddleware, addOption);

// DELETE /api/polls/:id/option/:optId  (admin)
router.delete('/:id/option/:optId', authMiddleware, removeOption);

// POST /api/polls/:pollId/vote/:optId  (user)
router.post('/:pollId/vote/:optId', authMiddleware, vote);

// DELETE /api/polls/:pollId/unvote  (user)
router.delete('/:pollId/unvote', authMiddleware, unvote);

export default router;
