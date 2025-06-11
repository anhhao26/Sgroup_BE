import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true },
    votes: { type: Number, default: 0 },
    userVote: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        username: { type: String }
      }
    ]
  },
  { _id: true }
);

const pollSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    options: [optionSchema],
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
