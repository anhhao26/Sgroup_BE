import mongoose from 'mongoose';
import Poll from '../models/Poll.js';
import { BadRequestError, ForbiddenError, NotFoundError, SuccessResponse } from '../utils/ApiResponse.js';


export async function getAllPolls(req, res, next) {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const [total, polls] = await Promise.all([
      Poll.countDocuments(),
      Poll.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('title creator isLocked createdAt expiresAt options')
    ]);

    const pollData = polls.map(poll => {
      const votesCount = poll.options.reduce((sum, opt) => sum + opt.votes, 0);
      return {
        id: poll._id,
        title: poll.title,
        creator: poll.creator,
        isLocked: poll.isLocked,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        votesCount
      };
    });

    return new SuccessResponse({
      message: 'Get all Poll successfully',
      data: {
        polls: pollData,
        total,
        page,
        limit
      }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 * thong tin ve poll
 */
export async function getPollById(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');

    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    const options = poll.options.map(opt => ({
      id: opt._id,
      text: opt.text,
      votes: opt.votes,
      userVote: opt.userVote 
    }));

    const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes, 0);

    return new SuccessResponse({
      message: 'Get Poll successfully',
      data: {
        id: poll._id,
        title: poll.title,
        description: poll.description,
        options,
        creator: poll.creator,
        isLocked: poll.isLocked,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        totalVotes
      }
    }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
tao poll moi
 */
export async function createPoll(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can create poll');

    const { title, description, options: optionTexts, expiresAt } = req.body;
    if (!title || !Array.isArray(optionTexts) || optionTexts.length < 2) {
      throw new BadRequestError('Title và ít nhất 2 options là bắt buộc');
    }
    const options = optionTexts.map(text => ({ text, votes: 0, userVote: [] }));

    const newPoll = await Poll.create({
      title,
      description,
      options,
      creator: {
        id: req.user._id,
        username: req.user.username
      },
      expiresAt: expiresAt || null
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
 cap nhat poll
 */
export async function updatePoll(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can update poll');

    const { id } = req.params;
    const { title, description, expiresAt } = req.body;
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');

    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    // Cập nhật
    if (title) poll.title = title;
    if (description !== undefined) poll.description = description;
    if (expiresAt !== undefined) poll.expiresAt = expiresAt;

    await poll.save();

    return new SuccessResponse({ message: 'Poll updated successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 xoa cai poll
 */
export async function deletePoll(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can delete poll');

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');

    const poll = await Poll.findByIdAndDelete(id);
    if (!poll) throw new NotFoundError('Poll not found');

    return new SuccessResponse({ message: 'Poll deleted successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
lock
 */
export async function lockPoll(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can lock poll');

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');

    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    poll.isLocked = true;
    await poll.save();

    return new SuccessResponse({ message: 'Poll locked successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
unlock
 */
export async function unlockPoll(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can unlock poll');

    const { id } = req.params;
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');

    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    poll.isLocked = false;
    await poll.save();

    return new SuccessResponse({ message: 'Poll unlocked successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
them option cho cai poll
 */
export async function addOption(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can add option');

    const { id } = req.params;
    const { text } = req.body;
    if (!text) throw new BadRequestError('Option text is required');

    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    // Khóa thì không cho thêm
    if (poll.isLocked) throw new BadRequestError('Poll is locked');

    poll.options.push({ text, votes: 0, userVote: [] });
    await poll.save();

    return new SuccessResponse({ message: 'Option added successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
xoa cai option
 */
export async function removeOption(req, res, next) {
  try {
    if (req.user.role !== 'admin') throw new ForbiddenError('Only admin can remove option');

    const { id, optId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(optId)) {
      throw new BadRequestError('Invalid ID');
    }

    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    if (poll.isLocked) throw new BadRequestError('Poll is locked');

    const idx = poll.options.findIndex(o => o._id.toString() === optId);
    if (idx === -1) throw new NotFoundError('Option not found');

    poll.options.splice(idx, 1);
    await poll.save();

    return new SuccessResponse({ message: 'Option removed successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
vote
 */
export async function vote(req, res, next) {
  try {
    const { pollId, optId } = req.params;
    const userId = req.user._id.toString();
    const username = req.user.username;

    // 1. Validate ID
    if (!mongoose.isValidObjectId(pollId) || !mongoose.isValidObjectId(optId)) {
      throw new BadRequestError('Invalid ID');
    }

    // 2. Lấy poll từ DB
    const poll = await Poll.findById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');

    // 3. Kiểm tra business rule: locked hoặc expired
    if (poll.isLocked) throw new BadRequestError('Poll is locked');
    if (poll.expiresAt && poll.expiresAt < Date.now()) {
      throw new BadRequestError('Poll has expired');
    }

    // 4. Kiểm tra xem user đã vote chưa
    const hasVoted = poll.options.some(opt =>
      opt.userVote.some(u => u.userId.toString() === userId)
    );
    if (hasVoted) {
      throw new BadRequestError('You have already voted on this poll');
    }

    // 5. Tìm đúng option
    const option = poll.options.id(optId);
    if (!option) throw new NotFoundError('Option not found');

    // 6. Cập nhật votes va userVote
    option.votes += 1;
    option.userVote.push({ userId, username });

    // 7. Lưu poll
    await poll.save();

    return new SuccessResponse({ message: 'Voted successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}

/**
 xoa vote cho user
 */
export async function unvote(req, res, next) {
  try {
    const { pollId } = req.params;
    const userId = req.user._id.toString();

    // 1. Validate pollId
    if (!mongoose.isValidObjectId(pollId)) throw new BadRequestError('Invalid poll ID');

    // 2. Lấy poll
    const poll = await Poll.findById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');

    // 3. Tìm option mà user đã vote
    const option = poll.options.find(opt =>
      opt.userVote.some(u => u.userId.toString() === userId)
    );
    if (!option) {
      throw new BadRequestError('You have not voted on this poll');
    }

    // 4. Tìm index và xóa vote
    const voteIndex = option.userVote.findIndex(u => u.userId.toString() === userId);
    option.votes = Math.max(option.votes - 1, 0);
    option.userVote.splice(voteIndex, 1);

    // 5. Lưu poll
    await poll.save();

    return new SuccessResponse({ message: 'Unvoted successfully' }).send(res);
  } catch (err) {
    next(err);
  }
}
