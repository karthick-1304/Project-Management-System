import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { HttpError } from './errorHandler.js';

/** Require a valid Bearer JWT; attaches req.user = { id, email }. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return next(new HttpError(401, 'Authentication required'));
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    req.user = { id: payload.sub, email: payload.email };
    next();
  } catch {
    next(new HttpError(401, 'Invalid or expired token'));
  }
}
