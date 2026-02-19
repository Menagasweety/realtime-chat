import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import FriendRequest from '../models/FriendRequest.js';
import Conversation from '../models/Conversation.js';
import Group from '../models/Group.js';
import Message from '../models/Message.js';

dotenv.config();

const usersSeed = [
  { username: 'ava', password: 'Ava@1234' },
  { username: 'noah', password: 'Noah@1234' },
  { username: 'mia', password: 'Mia@1234' }
];

const run = async () => {
  await connectDB();

  await Promise.all([
    User.deleteMany({}),
    FriendRequest.deleteMany({}),
    Conversation.deleteMany({}),
    Group.deleteMany({}),
    Message.deleteMany({})
  ]);

  const [ava, noah, mia] = await Promise.all(
    usersSeed.map(async (u) => {
      const passwordHash = await bcrypt.hash(u.password, 12);
      return User.create({ username: u.username, passwordHash, avatarUrl: '' });
    })
  );

  await FriendRequest.create({ fromUserId: ava._id, toUserId: mia._id, status: 'pending' });

  ava.friends.push({ userId: noah._id, status: 'accepted' });
  noah.friends.push({ userId: ava._id, status: 'accepted' });
  ava.friends.push({ userId: mia._id, status: 'pending_sent' });
  mia.friends.push({ userId: ava._id, status: 'pending_received' });
  await ava.save();
  await noah.save();
  await mia.save();

  const conversation = await Conversation.create({ participants: [ava._id, noah._id] });
  await Message.create({
    chatType: 'private',
    conversationId: conversation._id,
    senderId: ava._id,
    senderName: ava.username,
    type: 'text',
    text: 'Hey Noah, seeded private chat is ready.'
  });

  const group = await Group.create({
    name: 'Launch Crew',
    members: [ava._id, noah._id, mia._id],
    admins: [ava._id],
    createdBy: ava._id
  });

  await Message.create({
    chatType: 'group',
    groupId: group._id,
    senderId: ava._id,
    senderName: ava.username,
    type: 'text',
    text: 'Welcome to the seeded group chat.'
  });

  console.log('Seed complete');
  console.log('Users: ava / noah / mia');
  console.log('Password for all: <Name>@1234');

  await mongoose.disconnect();
};

run().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});


