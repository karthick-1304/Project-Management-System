import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'node:crypto';
import { query } from '../config/db.js';
import { env } from '../config/env.js';
import { HttpError } from '../middleware/errorHandler.js';

const SALT_ROUNDS = 10;
const OTP_TTL_MINUTES = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function publicUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    themePreference: row.theme_preference,
    createdAt: row.created_at,
  };
}

export function signToken(user) {
  return jwt.sign({ sub: user.id, email: user.email }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

export async function register({ name, email, password }) {
  if (!name?.trim()) throw new HttpError(400, 'Name is required');
  if (!EMAIL_RE.test(email || '')) throw new HttpError(400, 'A valid email is required');
  if (!password || password.length < 8)
    throw new HttpError(400, 'Password must be at least 8 characters');

  const normEmail = email.trim().toLowerCase();
  const exists = await query('SELECT 1 FROM users WHERE lower(email) = $1', [normEmail]);
  if (exists.rowCount) throw new HttpError(409, 'An account with this email already exists');

  const hash = await bcrypt.hash(password, SALT_ROUNDS);
  const { rows } = await query(
    `INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3)
     RETURNING id, name, email, theme_preference, created_at`,
    [name.trim(), normEmail, hash]
  );
  const user = rows[0];
  return { user: publicUser(user), token: signToken(user) };
}

export async function login({ email, password }) {
  if (!email || !password) throw new HttpError(400, 'Email and password are required');
  const normEmail = email.trim().toLowerCase();
  const { rows } = await query(
    `SELECT id, name, email, password_hash, theme_preference, created_at
       FROM users WHERE lower(email) = $1`,
    [normEmail]
  );
  const user = rows[0];
  // Constant-ish: still compare when user missing to reduce enumeration signal.
  const ok = user
    ? await bcrypt.compare(password, user.password_hash)
    : await bcrypt.compare(password, '$2b$10$invalidinvalidinvalidinvalidinvalidinvalidinv');
  if (!user || !ok) throw new HttpError(401, 'Invalid email or password');
  return { user: publicUser(user), token: signToken(user) };
}

export async function getMe(userId) {
  const { rows } = await query(
    `SELECT id, name, email, theme_preference, created_at FROM users WHERE id = $1`,
    [userId]
  );
  if (!rows[0]) throw new HttpError(404, 'User not found');
  return publicUser(rows[0]);
}

export async function changePassword(userId, { oldPassword, newPassword }) {
  if (!newPassword || newPassword.length < 8)
    throw new HttpError(400, 'New password must be at least 8 characters');
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [userId]);
  if (!rows[0]) throw new HttpError(404, 'User not found');
  const ok = await bcrypt.compare(oldPassword || '', rows[0].password_hash);
  if (!ok) throw new HttpError(401, 'Current password is incorrect');
  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, userId]);
  return { ok: true };
}

/** Generate a 6-digit OTP, store its hash, and return the plaintext OTP + user. */
export async function createPasswordResetOtp(email) {
  const normEmail = (email || '').trim().toLowerCase();
  const { rows } = await query('SELECT id, name, email FROM users WHERE lower(email) = $1', [
    normEmail,
  ]);
  const user = rows[0];
  if (!user) return { user: null, otp: null }; // don't reveal existence

  const otp = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
  const otpHash = await bcrypt.hash(otp, SALT_ROUNDS);
  const expires = new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);

  // Invalidate previous unused codes, then insert the new one.
  await query('UPDATE password_resets SET used = true WHERE user_id = $1 AND used = false', [
    user.id,
  ]);
  await query(
    'INSERT INTO password_resets (user_id, otp_hash, expires_at) VALUES ($1, $2, $3)',
    [user.id, otpHash, expires]
  );
  return { user, otp };
}

export async function resetPasswordWithOtp({ email, otp, newPassword }) {
  if (!newPassword || newPassword.length < 8)
    throw new HttpError(400, 'New password must be at least 8 characters');
  const normEmail = (email || '').trim().toLowerCase();
  const { rows: users } = await query('SELECT id FROM users WHERE lower(email) = $1', [normEmail]);
  const user = users[0];
  if (!user) throw new HttpError(400, 'Invalid or expired code');

  const { rows } = await query(
    `SELECT id, otp_hash, expires_at FROM password_resets
      WHERE user_id = $1 AND used = false
      ORDER BY created_at DESC LIMIT 1`,
    [user.id]
  );
  const reset = rows[0];
  if (!reset || new Date(reset.expires_at) < new Date())
    throw new HttpError(400, 'Invalid or expired code');

  const ok = await bcrypt.compare(otp || '', reset.otp_hash);
  if (!ok) throw new HttpError(400, 'Invalid or expired code');

  const hash = await bcrypt.hash(newPassword, SALT_ROUNDS);
  await query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, user.id]);
  await query('UPDATE password_resets SET used = true WHERE id = $1', [reset.id]);
  return { ok: true };
}
