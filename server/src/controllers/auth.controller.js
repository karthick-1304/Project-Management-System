import { asyncHandler } from '../middleware/errorHandler.js';
import * as authService from '../services/auth.service.js';
import { sendOtpEmail } from '../services/email.service.js';
import { env } from '../config/env.js';

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  res.status(201).json(result);
});

export const login = asyncHandler(async (req, res) => {
  const result = await authService.login(req.body);
  res.json(result);
});

// JWT is stateless; logout is handled client-side by discarding the token.
// Endpoint exists for a clean client contract (and future token-blocklist).
export const logout = asyncHandler(async (req, res) => {
  res.json({ ok: true });
});

export const me = asyncHandler(async (req, res) => {
  const user = await authService.getMe(req.user.id);
  res.json({ user });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user.id, req.body);
  res.json({ ok: true });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { user, otp } = await authService.createPasswordResetOtp(req.body.email);
  if (user && otp) await sendOtpEmail(user, otp);
  // Always respond the same way to avoid email enumeration.
  const payload = { ok: true, message: 'If that email exists, a reset code has been sent.' };
  // In dev without SMTP configured, surface the OTP to ease testing.
  if (env.nodeEnv !== 'production' && !env.smtp.host && otp) payload.devOtp = otp;
  res.json(payload);
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPasswordWithOtp(req.body);
  res.json({ ok: true });
});
