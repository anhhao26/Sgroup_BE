import PollService from '../services/PollService.js';
import { SuccessResponse } from '../utils/ApiResponse.js';

const pollService = new PollService();

/**
 * GET /api/polls?page=&limit=
 */
export async function getAllPolls(req, res, next) {
  try {
    const { page, limit } = req.query;
    const result = await pollService.getAllPolls({ page, limit });
    return new SuccessResponse({
      message: 'Get all Poll successfully',
      data: result
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/polls/:id
 */
export async function getPollById(req, res, next) {
  try {
    const poll = await pollService.getPollById(req.params.id);
    return new SuccessResponse({
      message: 'Get Poll successfully',
      data: poll
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/polls
 */
export async function createPoll(req, res, next) {
  try {
    const { question, options, expiresAt } = req.body;
    const newPoll = await pollService.createPoll({
      question,
      optionTexts: options,
      expiresAt,
      creator: { id: req.user._id, username: req.user.username },
      requesterRole: req.user.role
    });
    return new SuccessResponse({
      message: 'Poll created successfully',
      statusCode: 201,
      data: { id: newPoll._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * PUT /api/polls/:id
 */
export async function updatePoll(req, res, next) {
  try {
    const { question, expiresAt } = req.body;
    const updatedPoll = await pollService.updatePoll(
      req.params.id,
      { question, expiresAt },
      req.user.role
    );
    return new SuccessResponse({
      message: 'Poll updated successfully',
      data: { id: updatedPoll._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/polls/:id
 */
export async function deletePoll(req, res, next) {
  try {
    await pollService.deletePoll(req.params.id, req.user.role);
    return new SuccessResponse({ message: 'Poll deleted successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/polls/:id/lock
 */
export async function lockPoll(req, res, next) {
  try {
    const locked = await pollService.lockPoll(req.params.id, req.user.role);
    return new SuccessResponse({
      message: 'Poll locked successfully',
      data: { id: locked._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * PATCH /api/polls/:id/unlock
 */
export async function unlockPoll(req, res, next) {
  try {
    const unlocked = await pollService.unlockPoll(req.params.id, req.user.role);
    return new SuccessResponse({
      message: 'Poll unlocked successfully',
      data: { id: unlocked._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/polls/:id/option
 */
export async function addOption(req, res, next) {
  try {
    const { text } = req.body;
    const poll = await pollService.addOption(req.params.id, text, req.user.role);
    return new SuccessResponse({
      message: 'Option added successfully',
      data: { id: poll._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/polls/:id/option/:optId
 */
export async function removeOption(req, res, next) {
  try {
    const poll = await pollService.removeOption(req.params.id, req.params.optId, req.user.role);
    return new SuccessResponse({
      message: 'Option removed successfully',
      data: { id: poll._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/polls/:pollId/vote/:optId
 */
export async function vote(req, res, next) {
  try {
    const poll = await pollService.vote(
      req.params.pollId,
      req.params.optId,
      { id: req.user._id, username: req.user.username }
    );
    return new SuccessResponse({
      message: 'Voted successfully',
      data: { id: poll._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/polls/:pollId/unvote
 */
export async function unvote(req, res, next) {
  try {
    const poll = await pollService.unvote(req.params.pollId, req.user._id);
    return new SuccessResponse({
      message: 'Unvoted successfully',
      data: { id: poll._id }
    }).send(res);
  } catch (err) {
    next(err);
  }
}
