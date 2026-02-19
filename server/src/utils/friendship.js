import User from '../models/User.js';

export const isAcceptedFriend = (user, targetUserId) =>
  user.friends.some(
    (f) => f.userId.toString() === targetUserId.toString() && f.status === 'accepted'
  );

export const ensureAcceptedFriends = async (userIdA, userIdB) => {
  const userA = await User.findById(userIdA);
  if (!userA) return false;
  return isAcceptedFriend(userA, userIdB);
};
