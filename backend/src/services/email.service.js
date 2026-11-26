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