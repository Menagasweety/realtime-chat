import jwt from 'jsonwebtoken';

export const signToken = (payload) =>
  jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });

export const verifyToken = (token) => jwt.verify(token, process.env.JWT_SECRET);

const normalizeSameSite = (value) => {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'lax' || normalized === 'strict' || normalized === 'none') return normalized;
  return 'lax';
};

const toBoolean = (value) => String(value || '').toLowerCase() === 'true';

export const buildAuthCookieOptions = () => {
  const defaultSameSite = process.env.NODE_ENV === 'production' ? 'none' : 'lax';
  const sameSite = normalizeSameSite(process.env.COOKIE_SAME_SITE || defaultSameSite);
  const secure = process.env.COOKIE_SECURE
    ? toBoolean(process.env.COOKIE_SECURE)
    : sameSite === 'none' || process.env.NODE_ENV === 'production';

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: 7 * 24 * 60 * 60 * 1000
  };
};
