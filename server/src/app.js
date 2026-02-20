import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import friendRoutes from './routes/friendRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import groupRoutes from './routes/groupRoutes.js';
import uploadRoutes from './routes/uploadRoutes.js';

console.log("CLIENT_URL:", process.env.CLIENT_URL);
const app = express();

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

const allowedOrigins = parseConfiguredOrigins();

app.use(
  cors({
    origin: (origin, cb) => {
      // allow requests with no origin (Postman, health checks)
      if (!origin) return cb(null, true);

      if (allowLocalOrigin(origin) || allowedOrigins.has(origin)) {
        return cb(null, true);
      }

      console.log("CORS blocked origin:", origin);
      console.log("Allowed origins:", Array.from(allowedOrigins));
      return cb(null, false); // ✅ DO NOT THROW ERROR
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// ✅ handle preflight properly
app.options("*", cors());

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/friends', friendRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/upload', uploadRoutes);

app.use((error, _req, res, _next) => {
  if (error?.message === 'Unsupported file type') {
    return res.status(400).json({ message: error.message });
  }

  if (error?.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: 'File too large' });
  }

  console.error(error);
  return res.status(500).json({ message: 'Internal server error' });
});

export default app;
