import { sendMail } from '../config/mailer.js';

export async function sendOtpEmail(user, otp) {
  const subject = 'Your password reset code';
  const text = `Hi ${user.name},\n\nYour password reset code is: ${otp}\nIt expires in 10 minutes.\n\nIf you didn't request this, you can ignore this email.`;
  const html = `<p>Hi ${user.name},</p><p>Your password reset code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:3px">${otp}</p>
    <p>It expires in 10 minutes. If you didn't request this, ignore this email.</p>`;
  return sendMail({ to: user.email, subject, text, html });
}

export async function sendCollaboratorAddedEmail(email, project, inviter) {
  const subject = `You were added to "${project.name}"`;
  const text = `${inviter.name} added you as a collaborator on the project "${project.name}" (${project.key}).`;
  return sendMail({ to: email, subject, text, html: `<p>${text}</p>` });
}

export async function sendCollaboratorRemovedEmail(email, project, remover) {
  const subject = `You were removed from "${project.name}"`;
  const text = `${remover.name} removed you from the project "${project.name}" (${project.key}).`;
  return sendMail({ to: email, subject, text, html: `<p>${text}</p>` });
}
