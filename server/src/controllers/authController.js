import bcrypt from 'bcrypt';
import User from '../models/User.js';
import { signToken, buildAuthCookieOptions } from '../utils/jwt.js';

const cookieName = process.env.COOKIE_NAME || 'chat_token';

const toProfile = (user) => ({
  id: user._id,
  username: user.username,
  avatarUrl: user.avatarUrl,
  lastSeen: user.lastSeen,
  createdAt: user.createdAt
});

export const register = async (req, res) => {
  try {
    const { username, password } = req.body;
    const normalized = username.toLowerCase();
    const exists = await User.findOne({ username: normalized });
    if (exists) return res.status(409).json({ message: 'Username already exists' });

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ username: normalized, passwordHash });

    const token = signToken({ userId: user._id.toString(), username: user.username });
    res.cookie(cookieName, token, buildAuthCookieOptions());

    return res.status(201).json({ user: toProfile(user) });
  } catch (error) {
    if (error?.code === 11000) {
      return res.status(409).json({ message: 'Username already exists' });
    }
    return res.status(500).json({ message: 'Registration failed' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });

    const token = signToken({ userId: user._id.toString(), username: user.username });
    res.cookie(cookieName, token, buildAuthCookieOptions());

    return res.json({ user: toProfile(user) });
  } catch {
    return res.status(500).json({ message: 'Login failed' });
  }
};

export const logout = async (_req, res) => {
  res.clearCookie(cookieName, buildAuthCookieOptions());
  return res.json({ message: 'Logged out' });
};

export const me = async (req, res) => res.json({ user: toProfile(req.user) });
