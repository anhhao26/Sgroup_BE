import mongoose from 'mongoose';
import Poll from '../models/Poll.js';
import {
  BadRequestError,
  ForbiddenError,
  NotFoundError
} from '../utils/ApiResponse.js';

export default class PollService {
  /**
   * Lấy danh sách poll có phân trang
   */
  async getAllPolls({ page = 1, limit = 10 }) {
    page = parseInt(page, 10) || 1;
    limit = parseInt(limit, 10) || 10;
    const skip = (page - 1) * limit;

    const [total, polls] = await Promise.all([
      Poll.countDocuments(),
      Poll.find()
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('question creator isLocked createdAt expiresAt options votes')
    ]);

    // Map ra data cần thiết
    const pollData = polls.map(poll => {
      const votesCount = poll.votes.length;
      return {
        id: poll._id,
        question: poll.question,
        creator: poll.creator,
        isLocked: poll.isLocked,
        createdAt: poll.createdAt,
        expiresAt: poll.expiresAt,
        votesCount
      };
    });

    return { total, page, limit, polls: pollData };
  }

  /**
   * Lấy chi tiết poll theo ID (kèm options, votes-detail)
   */
  async getPollById(id) {
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findById(id).populate('votes.user', 'username');
    if (!poll) throw new NotFoundError('Poll not found');

    // Build detail options + userVote array
    const options = poll.options.map(opt => {
      // Tìm votes liên quan đến option này
      const userVote = poll.votes
        .filter(v => v.option.toString() === opt._id.toString())
        .map(v => ({ userId: v.user._id, username: v.user.username }));
      return {
        id: opt._id,
        text: opt.text,
        votes: opt.voteCount,
        userVote
      };
    });
    const totalVotes = poll.votes.length;

    return {
      id: poll._id,
      question: poll.question,
      options,
      creator: poll.creator,
      isLocked: poll.isLocked,
      createdAt: poll.createdAt,
      expiresAt: poll.expiresAt,
      totalVotes
    };
  }

  /**
   * Tạo poll mới (chỉ admin)
   */
  async createPoll({ question, optionTexts, expiresAt, creator, requesterRole }) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can create poll');
    if (!question || !Array.isArray(optionTexts) || optionTexts.length < 2) {
      throw new BadRequestError('Question và ít nhất 2 options là bắt buộc');
    }
    const options = optionTexts.map(text => ({ text, voteCount: 0 }));
    const newPoll = new Poll({
      question,
      options,
      creator: { id: creator.id, username: creator.username },
      expiresAt: expiresAt || null
    });
    await newPoll.save();
    return newPoll;
  }

  /**
   * Cập nhật title/description/expiresAt (admin)
   */
  async updatePoll(id, { question, expiresAt }, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can update poll');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    if (question !== undefined) poll.question = question;
    poll.expiresAt = expiresAt !== undefined ? expiresAt : poll.expiresAt;

    await poll.save();
    return poll;
  }

  /**
   * Xóa poll (admin)
   */
  async deletePoll(id, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can delete poll');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findByIdAndDelete(id);
    if (!poll) throw new NotFoundError('Poll not found');
    return;
  }

  /**
   * Khóa poll (admin)
   */
  async lockPoll(id, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can lock poll');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    poll.isLocked = true;
    await poll.save();
    return poll;
  }

  /**
   * Mở khóa poll (admin)
   */
  async unlockPoll(id, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can unlock poll');
    if (!mongoose.isValidObjectId(id)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findById(id);
    if (!poll) throw new NotFoundError('Poll not found');

    poll.isLocked = false;
    await poll.save();
    return poll;
  }

  /**
   * Vote (user) – mỗi user chỉ vote 1 lần cho 1 poll, nhưng có thể unvote để vote lại
   */
  async vote(pollId, optionId, user) {
    const userId = user.id.toString();
    const username = user.username;

    if (!mongoose.isValidObjectId(pollId) || !mongoose.isValidObjectId(optionId)) {
      throw new BadRequestError('Invalid ID');
    }
    const poll = await Poll.findById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');

    if (poll.isLocked) throw new BadRequestError('Poll is locked');
    if (poll.expiresAt && poll.expiresAt < Date.now()) throw new BadRequestError('Poll has expired');

    // Kiểm tra user đã vote chưa
    const hasVoted = poll.votes.some(v => v.user.toString() === userId);
    if (hasVoted) {
      throw new BadRequestError('You have already voted on this poll');
    }

    // Tìm option
    const option = poll.options.id(optionId);
    if (!option) throw new NotFoundError('Option not found');

    // Tăng voteCount và thêm record vào poll.votes
    option.voteCount += 1;
    poll.votes.push({ user: userId, option: optionId });
    await poll.save();
    return poll;
  }

  /**
   * Unvote (user)
   */
  async unvote(pollId, userId) {
    if (!mongoose.isValidObjectId(pollId)) throw new BadRequestError('Invalid poll ID');
    const poll = await Poll.findById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');

    // Tìm record vote của user
    const voteRecord = poll.votes.find(v => v.user.toString() === userId.toString());
    if (!voteRecord) {
      throw new BadRequestError('You have not voted on this poll');
    }
    // Giảm voteCount của option đó
    const option = poll.options.id(voteRecord.option);
    if (option) {
      option.voteCount = Math.max(option.voteCount - 1, 0);
    }
    // Xoá record
    poll.votes = poll.votes.filter(v => v.user.toString() !== userId.toString());
    await poll.save();
    return poll;
  }

  /**
   * Thêm option mới vào poll (admin)
   */
  async addOption(pollId, text, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can add option');
    if (!text) throw new BadRequestError('Option text is required');
    if (!mongoose.isValidObjectId(pollId)) throw new BadRequestError('Invalid poll ID');

    const poll = await Poll.findById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.isLocked) throw new BadRequestError('Poll is locked');

    poll.options.push({ text, voteCount: 0 });
    await poll.save();
    return poll;
  }

  /**
   * Xóa option khỏi poll (admin)
   */
  async removeOption(pollId, optId, requesterRole) {
    if (requesterRole !== 'admin') throw new ForbiddenError('Only admin can remove option');
    if (!mongoose.isValidObjectId(pollId) || !mongoose.isValidObjectId(optId)) {
      throw new BadRequestError('Invalid ID');
    }

    const poll = await Poll.findById(pollId);
    if (!poll) throw new NotFoundError('Poll not found');
    if (poll.isLocked) throw new BadRequestError('Poll is locked');

    const option = poll.options.id(optId);
    if (!option) throw new NotFoundError('Option not found');
    option.remove();

    // Đồng thời xoá bất kỳ vote nào liên quan đến option đó
    poll.votes = poll.votes.filter(v => v.option.toString() !== optId.toString());
    await poll.save();
    return poll;
  }
}
