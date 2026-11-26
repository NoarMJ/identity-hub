import { mailer, MAIL_FROM, APP_URL } from "../config/mail.js";

// The user's name is untrusted input, so escape it before putting it in HTML
function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export async function sendVerificationEmail({ to, name, token }) {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  await mailer.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Verify your IdentityHub email",
    text:
      `Hi ${name},\n\n` +
      `Confirm your email address by opening this link:\n${link}\n\n` +
      `The link expires in 24 hours. If you did not create an account, ignore this email.`,
    html:
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>Confirm your email address:</p>` +
      `<p><a href="${link}">Verify my email</a></p>` +
      `<p>The link expires in 24 hours. If you did not create an account, ignore this email.</p>`,
  });
}
export async function sendPasswordResetEmail({ to, name, token }) {
  const link = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  await mailer.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Reset your IdentityHub password",
    text:
      `Hi ${name},\n\n` +
      `Someone asked to reset the password for this account. Open this link to choose a new one:\n${link}\n\n` +
      `The link expires in 1 hour and works once. If you did not ask for this, ignore this email: your password has not changed.`,
    html:
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>Someone asked to reset the password for this account.</p>` +
      `<p><a href="${link}">Choose a new password</a></p>` +
      `<p>The link expires in 1 hour and works once. If you did not ask for this, ignore this email: your password has not changed.</p>`,
  });
}

export async function sendPasswordChangedEmail({ to, name }) {
  await mailer.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Your IdentityHub password was changed",
    text:
      `Hi ${name},\n\n` +
      `The password for your account was just changed, and you were signed out everywhere.\n` +
      `If this was not you, reset your password again straight away.`,
    html:
      `<p>Hi ${escapeHtml(name)},</p>` +
      `<p>The password for your account was just changed, and you were signed out everywhere.</p>` +
      `<p>If this was not you, reset your password again straight away.</p>`,
  });
}