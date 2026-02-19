import Group from '../models/Group.js';
import Message from '../models/Message.js';

export const createGroup = async (req, res) => {
  const { name, memberIds = [], groupIcon = '' } = req.body;
  if (!name?.trim()) return res.status(400).json({ message: 'Group name required' });

  const uniqueMembers = [...new Set([req.user._id.toString(), ...memberIds])];

  const group = await Group.create({
    name: name.trim(),
    members: uniqueMembers,
    admins: [req.user._id],
    groupIcon,
    createdBy: req.user._id
  });

  return res.status(201).json({ group });
};

export const listGroups = async (req, res) => {
  const groups = await Group.find({ members: req.user._id })
    .populate('members', 'username avatarUrl lastSeen')
    .populate('admins', 'username')
    .sort({ updatedAt: -1 });
  return res.json({ groups });
};

export const addGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const isAdmin = group.admins.some((id) => id.toString() === req.user._id.toString());
  if (!isAdmin) return res.status(403).json({ message: 'Only admins can add members' });

  if (!group.members.some((id) => id.toString() === userId)) group.members.push(userId);
  await group.save();
  return res.json({ group });
};

export const removeGroupMember = async (req, res) => {
  const { groupId } = req.params;
  const { userId } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const isAdmin = group.admins.some((id) => id.toString() === req.user._id.toString());
  if (!isAdmin) return res.status(403).json({ message: 'Only admins can remove members' });

  group.members = group.members.filter((m) => m.toString() !== userId);
  group.admins = group.admins.filter((a) => a.toString() !== userId);

  await group.save();
  return res.json({ group });
};

export const renameGroup = async (req, res) => {
  const { groupId } = req.params;
  const { name } = req.body;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const isAdmin = group.admins.some((id) => id.toString() === req.user._id.toString());
  if (!isAdmin) return res.status(403).json({ message: 'Only admins can rename group' });
  if (!name?.trim()) return res.status(400).json({ message: 'name is required' });

  group.name = name.trim();
  await group.save();
  return res.json({ group });
};

export const updateGroupIcon = async (req, res) => {
  const { groupId } = req.params;
  const { groupIcon } = req.body;

  if (!groupIcon || typeof groupIcon !== 'string' || !groupIcon.startsWith('/api/uploads/')) {
    return res.status(400).json({ message: 'Invalid groupIcon' });
  }

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const isAdmin = group.admins.some((id) => id.toString() === req.user._id.toString());
  if (!isAdmin) return res.status(403).json({ message: 'Only admins can change group icon' });

  group.groupIcon = groupIcon;
  await group.save();
  return res.json({ group });
};

export const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const limit = Math.min(Number(req.query.limit || 40), 100);
  const before = req.query.before ? new Date(req.query.before) : null;

  const group = await Group.findById(groupId);
  if (!group) return res.status(404).json({ message: 'Group not found' });

  const isMember = group.members.some((m) => m.toString() === req.user._id.toString());
  if (!isMember) return res.status(403).json({ message: 'Forbidden' });

  const filter = { groupId };
  if (before) filter.createdAt = { $lt: before };

  const messages = await Message.find(filter).sort({ createdAt: -1 }).limit(limit + 1);
  const hasMore = messages.length > limit;
  const trimmed = hasMore ? messages.slice(0, limit) : messages;
  const ordered = trimmed.reverse();
  const nextBefore = hasMore ? ordered[0]?.createdAt : null;
  return res.json({ messages: ordered, hasMore, nextBefore });
};
