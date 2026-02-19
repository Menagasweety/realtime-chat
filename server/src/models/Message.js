import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    chatType: { type: String, enum: ['private', 'group'], required: true },
    conversationId: { type: mongoose.Schema.Types.ObjectId, ref: 'Conversation', default: null },
    groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderName: { type: String, required: true },
    type: { type: String, enum: ['text', 'image', 'file', 'voice'], default: 'text' },
    text: { type: String, default: '' },
    fileUrl: { type: String, default: '' },
    fileName: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    receipts: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        deliveredAt: { type: Date, default: null },
        readAt: { type: Date, default: null }
      }
    ]
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

messageSchema.index({ conversationId: 1, createdAt: -1 });
messageSchema.index({ groupId: 1, createdAt: -1 });

export default mongoose.model('Message', messageSchema);
