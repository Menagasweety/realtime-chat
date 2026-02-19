import mongoose from 'mongoose';

const friendRequestSchema = new mongoose.Schema(
  {
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    toUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' }
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

friendRequestSchema.index({ fromUserId: 1, toUserId: 1 }, { unique: true });

export default mongoose.model('FriendRequest', friendRequestSchema);
