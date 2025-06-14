import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    voteCount: { type: Number, default: 0 }
  },
  { _id: true }
);

const voteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    option: { type: mongoose.Schema.Types.ObjectId, required: true }
  },
  { _id: false }
);

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true },
    options: [optionSchema],
    votes: [voteSchema],
    creator: {
      id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      username: { type: String, required: true }
    },
    isLocked: { type: Boolean, default: false },
    expiresAt: { type: Date, default: null }
  },
  { timestamps: true }
);

export default mongoose.model('Poll', pollSchema);
