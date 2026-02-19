import mongoose from 'mongoose';
import User from '../models/User.js';

export const searchUsers = async (req, res) => {
  const { query = '' } = req.query;
  const clean = query.trim().toLowerCase();

  if (clean.length < 1) return res.json({ users: [] });

  const users = await User.find({
    _id: { $ne: req.user._id },
    username: { $regex: clean, $options: 'i' }
  })
    .select('username avatarUrl lastSeen friends')
    .limit(10);

  const mapped = users.map((u) => {
    const relation = req.user.friends.find((f) =>
      new mongoose.Types.ObjectId(f.userId).equals(u._id)
    );

    return {
      id: u._id,
      username: u.username,
      avatarUrl: u.avatarUrl,
      lastSeen: u.lastSeen,
      relation: relation?.status || 'none'
    };
  });

  return res.json({ users: mapped });
};

export const updateAvatar = async (req, res) => {
  const { avatarUrl } = req.body;
  if (!avatarUrl || typeof avatarUrl !== 'string' || !avatarUrl.startsWith('/api/uploads/')) {
    return res.status(400).json({ message: 'Invalid avatarUrl' });
  }

  const user = await User.findByIdAndUpdate(
    req.user._id,
    { avatarUrl },
    { new: true }
  ).select('username avatarUrl lastSeen createdAt');

  return res.json({
    user: {
      id: user._id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      lastSeen: user.lastSeen,
      createdAt: user.createdAt
    }
  });
};
