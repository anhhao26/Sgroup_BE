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

router.get('/', authMiddleware, getAllPolls);
router.post('/', authMiddleware, createPoll);
router.get('/:id', authMiddleware, getPollById);
router.put('/:id', authMiddleware, updatePoll);
router.delete('/:id', authMiddleware, deletePoll);
router.patch('/:id/lock', authMiddleware, lockPoll);
router.patch('/:id/unlock', authMiddleware, unlockPoll);
router.post('/:id/option', authMiddleware, addOption);
router.delete('/:id/option/:optId', authMiddleware, removeOption);
router.post('/:pollId/vote/:optId', authMiddleware, vote);
router.delete('/:pollId/unvote', authMiddleware, unvote);

export default router;
