import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (!env.smtp.host) {
    // eslint-disable-next-line no-console
    console.warn('[mailer] SMTP not configured — emails will be logged to console only.');
    return null;
  }
  transporter = nodemailer.createTransport({
    host: env.smtp.host,
    port: env.smtp.port,
    secure: env.smtp.secure,
    auth: env.smtp.user ? { user: env.smtp.user, pass: env.smtp.pass } : undefined,
  });
  return transporter;
}

/** Send an email. Falls back to console logging when SMTP is not configured. */
export async function sendMail({ to, subject, text, html }) {
  const t = getTransporter();
  if (!t) {
    // eslint-disable-next-line no-console
    console.log(`[mailer:dev] To: ${to} | Subject: ${subject}\n${text || html}`);
    return { queued: false };
  }
  await t.sendMail({ from: env.smtp.from, to, subject, text, html });
  return { queued: true };
}
