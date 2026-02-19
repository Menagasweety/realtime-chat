import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';
import { ensureAcceptedFriends } from '../utils/friendship.js';

export const createOrGetPrivateConversation = async (req, res) => {
  const { friendUserId } = req.body;
  if (!friendUserId) return res.status(400).json({ message: 'friendUserId is required' });

  const ok = await ensureAcceptedFriends(req.user._id, friendUserId);
  if (!ok) return res.status(403).json({ message: 'You can chat only with accepted friends' });

  let conversation = await Conversation.findOne({
    participants: { $all: [req.user._id, friendUserId], $size: 2 }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user._id, friendUserId],
      lastMessageAt: new Date()
    });
  }

  return res.json({ conversation });
};

export const getPrivateMessages = async (req, res) => {
  const { conversationId } = req.params;
  const limit = Math.min(Number(req.query.limit || 40), 100);
  const before = req.query.before ? new Date(req.query.before) : null;

  const conversation = await Conversation.findById(conversationId);
  if (!conversation) return res.status(404).json({ message: 'Conversation not found' });

  const isParticipant = conversation.participants.some(
    (id) => id.toString() === req.user._id.toString()
  );
  if (!isParticipant) return res.status(403).json({ message: 'Forbidden' });

  const filter = { conversationId };
  if (before) filter.createdAt = { $lt: before };

  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = messages.length > limit;
  const trimmed = hasMore ? messages.slice(0, limit) : messages;
  const ordered = trimmed.reverse();
  const nextBefore = hasMore ? ordered[0]?.createdAt : null;
  return res.json({ messages: ordered, hasMore, nextBefore });
};
