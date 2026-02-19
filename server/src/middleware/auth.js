import { verifyToken } from '../utils/jwt.js';
import User from '../models/User.js';

const cookieName = process.env.COOKIE_NAME || 'chat_token';

export const requireAuth = async (req, res, next) => {
  try {
    const token = req.cookies[cookieName];
    if (!token) return res.status(401).json({ message: 'Unauthorized' });

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return res.status(401).json({ message: 'Invalid user' });

    req.user = user;
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid token' });
  }
};

export const socketAuth = async (socket, next) => {
  try {
    const rawCookie = socket.handshake.headers.cookie || '';
    const parsed = Object.fromEntries(
      rawCookie.split(';').map((entry) => {
        const [k, ...v] = entry.trim().split('=');
        return [k, decodeURIComponent(v.join('='))];
      })
    );
    const token = parsed[cookieName];
    if (!token) return next(new Error('Unauthorized'));

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).select('-passwordHash');
    if (!user) return next(new Error('Invalid user'));

    socket.user = user;
    return next();
  } catch {
    return next(new Error('Invalid token'));
  }
};
