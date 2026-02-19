import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

const setFriendStatus = (user, targetId, status) => {
  const existing = user.friends.find((f) => f.userId.toString() === targetId.toString());
  if (existing) {
    existing.status = status;
  } else {
    user.friends.push({ userId: targetId, status });
  }
};

export const sendFriendRequest = async (req, res) => {
  const { targetUserId, username } = req.body;

  const target = targetUserId
    ? await User.findById(targetUserId)
    : await User.findOne({ username: (username || '').toLowerCase() });

  if (!target) return res.status(404).json({ message: 'User not found' });
  if (target._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ message: 'Cannot friend yourself' });
  }

  const already = req.user.friends.find((f) => f.userId.toString() === target._id.toString());
  if (already?.status === 'accepted') {
    return res.status(400).json({ message: 'Already friends' });
  }

  const existingRequest = await FriendRequest.findOne({
    $or: [
      { fromUserId: req.user._id, toUserId: target._id },
      { fromUserId: target._id, toUserId: req.user._id }
    ],
    status: 'pending'
  });

  if (existingRequest) {
    if (existingRequest.fromUserId.toString() === target._id.toString()) {
      return res.status(409).json({ message: 'Incoming friend request already exists. Please accept it.' });
    }
    return res.status(409).json({ message: 'A pending request already exists' });
  }

  // Reuse/reset old request documents to avoid unique index collisions.
  let request = await FriendRequest.findOne({
    fromUserId: req.user._id,
    toUserId: target._id
  });

  if (!request) {
    const reverse = await FriendRequest.findOne({
      fromUserId: target._id,
      toUserId: req.user._id
    });
    if (reverse && reverse.status !== 'pending') {
      await FriendRequest.deleteOne({ _id: reverse._id });
    }
  }

  if (request) {
    request.status = 'pending';
    await request.save();
  } else {
    request = await FriendRequest.create({
      fromUserId: req.user._id,
      toUserId: target._id,
      status: 'pending'
    });
  }

  const sender = await User.findById(req.user._id);
  setFriendStatus(sender, target._id, 'pending_sent');
  setFriendStatus(target, req.user._id, 'pending_received');
  await sender.save();
  await target.save();

  req.app.get('io').to(`user:${target._id}`).emit('friend:request:new', {
    requestId: request._id,
    fromUser: { id: sender._id, username: sender.username, avatarUrl: sender.avatarUrl }
  });

  return res.status(201).json({ message: 'Friend request sent', requestId: request._id });
};

export const acceptFriendRequest = async (req, res) => {
  const { requestId } = req.body;
  const request = await FriendRequest.findById(requestId);
  if (!request || request.toUserId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Request not found' });
  }
  if (request.status !== 'pending') {
    return res.status(400).json({ message: 'Request already handled' });
  }

  request.status = 'accepted';
  await request.save();

  const [receiver, sender] = await Promise.all([
    User.findById(request.toUserId),
    User.findById(request.fromUserId)
  ]);

  setFriendStatus(receiver, sender._id, 'accepted');
  setFriendStatus(sender, receiver._id, 'accepted');
  await receiver.save();
  await sender.save();

  req.app.get('io').to(`user:${sender._id}`).emit('friend:request:update', {
    requestId: request._id,
    status: 'accepted'
  });

  return res.json({ message: 'Friend request accepted' });
};

export const rejectFriendRequest = async (req, res) => {
  const { requestId } = req.body;
  const request = await FriendRequest.findById(requestId);
  if (!request || request.toUserId.toString() !== req.user._id.toString()) {
    return res.status(404).json({ message: 'Request not found' });
  }

  request.status = 'rejected';
  await request.save();

  const [receiver, sender] = await Promise.all([
    User.findById(request.toUserId),
    User.findById(request.fromUserId)
  ]);

  receiver.friends = receiver.friends.filter((f) => f.userId.toString() !== sender._id.toString());
  sender.friends = sender.friends.filter((f) => f.userId.toString() !== receiver._id.toString());
  await receiver.save();
  await sender.save();

  req.app.get('io').to(`user:${sender._id}`).emit('friend:request:update', {
    requestId: request._id,
    status: 'rejected'
  });

  return res.json({ message: 'Friend request rejected' });
};

export const listFriends = async (req, res) => {
  const acceptedIds = req.user.friends
    .filter((f) => f.status === 'accepted')
    .map((f) => f.userId);

  const friends = await User.find({ _id: { $in: acceptedIds } }).select('username avatarUrl lastSeen');
  const pendingReceived = await FriendRequest.find({
    toUserId: req.user._id,
    status: 'pending'
  }).populate('fromUserId', 'username avatarUrl');

  const data = await Promise.all(
    friends.map(async (f) => {
      const conversation = await Conversation.findOne({
        participants: { $all: [req.user._id, f._id], $size: 2 }
      });
      let lastMessage = null;
      if (conversation) {
        lastMessage = await Message.findOne({ conversationId: conversation._id })
          .sort({ createdAt: -1 })
          .select('text type fileName createdAt senderName');
      }

      return {
        id: f._id,
        username: f.username,
        avatarUrl: f.avatarUrl,
        lastSeen: f.lastSeen,
        lastMessage,
        conversationId: conversation?._id || null
      };
    })
  );

  return res.json({
    friends: data,
    pendingReceived: pendingReceived.map((r) => ({
      requestId: r._id,
      fromUser: r.fromUserId
    }))
  });
};
