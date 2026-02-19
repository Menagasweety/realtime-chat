import { Server } from 'socket.io';
import { socketAuth } from '../middleware/auth.js';
import Conversation from '../models/Conversation.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';
import User from '../models/User.js';
import { ensureAcceptedFriends } from '../utils/friendship.js';

const onlineUsers = new Map();

const isOnline = (userId) => (onlineUsers.get(String(userId)) || new Set()).size > 0;
const allowLocalOrigin = (origin) => {
  if (!origin) return true;
  return /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin);
};

const parseConfiguredOrigins = () => {
  const raw = `${process.env.CLIENT_URL || ''},${process.env.CLIENT_URLS || ''}`;
  return new Set(
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean)
  );
};

const emitReceiptUpdate = (io, message, userId, status) => {
  io.to(`user:${message.senderId}`).emit('message:receipt:update', {
    messageId: message._id,
    userId,
    status,
    chatType: message.chatType,
    targetId: message.chatType === 'private' ? message.conversationId : message.groupId,
    at: new Date().toISOString()
  });
};

const markUndeliveredAsDelivered = async (io, userId) => {
  const pending = await Message.find({
    receipts: { $elemMatch: { userId, deliveredAt: null } }
  });

  const now = new Date();

  for (const message of pending) {
    const receipt = message.receipts.find(
      (r) => r.userId.toString() === String(userId) && !r.deliveredAt
    );
    if (!receipt) continue;

    receipt.deliveredAt = now;
    await message.save();
    emitReceiptUpdate(io, message, userId, 'delivered');
  }
};

const markChatAsRead = async (io, userId, chatType, targetId) => {
  const filter =
    chatType === 'private'
      ? { chatType: 'private', conversationId: targetId, senderId: { $ne: userId } }
      : { chatType: 'group', groupId: targetId, senderId: { $ne: userId } };

  const unread = await Message.find({
    ...filter,
    receipts: { $elemMatch: { userId, readAt: null } }
  });

  if (unread.length === 0) return;

  const now = new Date();

  for (const message of unread) {
    const receipt = message.receipts.find(
      (r) => r.userId.toString() === String(userId) && !r.readAt
    );
    if (!receipt) continue;

    if (!receipt.deliveredAt) receipt.deliveredAt = now;
    receipt.readAt = now;
    await message.save();
    emitReceiptUpdate(io, message, userId, 'read');
  }
};

export const initSocket = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: (origin, cb) => {
        const configuredOrigins = parseConfiguredOrigins();
        if (allowLocalOrigin(origin) || configuredOrigins.has(origin)) return cb(null, true);
        return cb(new Error('Not allowed by CORS'));
      },
      credentials: true
    }
  });

  io.use(socketAuth);

  io.on('connection', async (socket) => {
    const userId = socket.user._id.toString();

    if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
    onlineUsers.get(userId).add(socket.id);

    socket.join(`user:${userId}`);
    io.emit('users:online', { userIds: [...onlineUsers.keys()] });
    io.emit('user:status', { userId, status: 'online' });

    await markUndeliveredAsDelivered(io, userId);

    socket.on('room:join', async ({ chatType, targetId }) => {
      if (chatType === 'private') {
        const conversation = await Conversation.findById(targetId);
        if (!conversation) return;
        const allowed = conversation.participants.some((id) => id.toString() === userId);
        if (!allowed) return;
        socket.join(`private:${conversation._id}`);
      }

      if (chatType === 'group') {
        const group = await Group.findById(targetId);
        if (!group) return;
        const allowed = group.members.some((id) => id.toString() === userId);
        if (!allowed) return;
        socket.join(`group:${group._id}`);
      }
    });

    socket.on('typing:start', ({ chatType, conversationId, groupId, targetId }) => {
      const id = targetId || conversationId || groupId;
      if (!id) return;
      socket.to(`${chatType}:${id}`).emit('typing:start', {
        chatType,
        conversationId: chatType === 'private' ? id : undefined,
        groupId: chatType === 'group' ? id : undefined,
        user: { id: userId, username: socket.user.username }
      });
    });

    socket.on('typing:stop', ({ chatType, conversationId, groupId, targetId }) => {
      const id = targetId || conversationId || groupId;
      if (!id) return;
      socket.to(`${chatType}:${id}`).emit('typing:stop', {
        chatType,
        conversationId: chatType === 'private' ? id : undefined,
        groupId: chatType === 'group' ? id : undefined,
        userId
      });
    });

    socket.on('message:read', async ({ chatType, conversationId, groupId, targetId }) => {
      const id = targetId || conversationId || groupId;
      if (!id) return;
      await markChatAsRead(io, userId, chatType, id);
    });

    socket.on('message:send', async ({ chatType, targetId, messagePayload }) => {
      try {
        if (chatType === 'private') {
          const conversation = await Conversation.findById(targetId);
          if (!conversation) return;

          const isParticipant = conversation.participants.some((id) => id.toString() === userId);
          if (!isParticipant) return;

          const peerId = conversation.participants.find((id) => id.toString() !== userId);
          const isFriend = await ensureAcceptedFriends(userId, peerId);
          if (!isFriend) return;

          const now = new Date();
          const peerOnline = isOnline(peerId);
          const savedMessage = await Message.create({
            chatType,
            conversationId: conversation._id,
            senderId: userId,
            senderName: socket.user.username,
            receipts: [
              {
                userId: peerId,
                deliveredAt: peerOnline ? now : null,
                readAt: null
              }
            ],
            ...messagePayload
          });

          conversation.lastMessageAt = now;
          await conversation.save();

          io.to(`private:${conversation._id}`).emit('message:new', {
            chatType,
            targetId: conversation._id,
            savedMessage
          });

          io.to(`user:${peerId}`).emit('message:notify', {
            chatType,
            targetId: conversation._id,
            savedMessage
          });

          if (peerOnline) emitReceiptUpdate(io, savedMessage, String(peerId), 'delivered');
        }

        if (chatType === 'group') {
          const group = await Group.findById(targetId);
          if (!group) return;

          const isMember = group.members.some((id) => id.toString() === userId);
          if (!isMember) return;

          const now = new Date();
          const receipts = group.members
            .filter((id) => id.toString() !== userId)
            .map((id) => ({
              userId: id,
              deliveredAt: isOnline(id) ? now : null,
              readAt: null
            }));

          const savedMessage = await Message.create({
            chatType,
            groupId: group._id,
            senderId: userId,
            senderName: socket.user.username,
            receipts,
            ...messagePayload
          });

          io.to(`group:${group._id}`).emit('message:new', {
            chatType,
            targetId: group._id,
            savedMessage
          });

          group.members.forEach((memberId) => {
            if (memberId.toString() !== userId) {
              io.to(`user:${memberId}`).emit('message:notify', {
                chatType,
                targetId: group._id,
                savedMessage
              });

              if (isOnline(memberId)) emitReceiptUpdate(io, savedMessage, String(memberId), 'delivered');
            }
          });
        }
      } catch {
        socket.emit('message:error', { message: 'Failed to send message' });
      }
    });

    socket.on('disconnect', async () => {
      const sockets = onlineUsers.get(userId);
      if (!sockets) return;
      sockets.delete(socket.id);
      if (sockets.size > 0) return;

      onlineUsers.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen });
      io.emit('user:status', { userId, status: 'offline', lastSeen: lastSeen.toISOString() });
      io.emit('users:online', { userIds: [...onlineUsers.keys()] });
    });
  });

  return { io, onlineUsers };
};
