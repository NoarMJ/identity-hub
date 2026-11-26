import { redis } from "../config/redis.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { hashPassword } from "./password.service.js";
import {
  sendPasswordResetEmail,
  sendPasswordChangedEmail,
} from "./email.service.js";
import { requireSessionStore, revokeAllSessions } from "./session.service.js";
import {
  replaceResetToken,
  findResetToken,
  consumeResetToken,
} from "../repositories/token.repository.js";
import {
  findUserByEmail,
  findUserById,
} from "../repositories/user.repository.js";
import { HttpError } from "../utils/httpError.js";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour
const RESEND_COOLDOWN_SECONDS = 60;

async function issueResetEmail(user) {
  const { token, tokenHash } = generateToken();
  await replaceResetToken(
    user.id,
    tokenHash,
    new Date(Date.now() + RESET_TOKEN_TTL_MS)
  );
  await sendPasswordResetEmail({ to: user.email, name: user.name, token });
}

// Looks identical from the outside whether or not the account exists
export async function requestPasswordReset(email) {
  try {
    if (!redis.isReady) return;
    const allowed = await redis.set(`resend:reset:${email}`, "1", {
      NX: true,
      EX: RESEND_COOLDOWN_SECONDS,
    });
    if (!allowed) return;
  } catch (error) {
    console.error("Reset cooldown check failed:", error.message);
    return;
  }

  const user = await findUserByEmail(email);

  if (user && user.status === "ACTIVE") {
    // Fire-and-forget: the response never waits for the token or the email
    issueResetEmail(user).catch((error) => {
      console.error("Password reset email failed:", error.message);
    });
  }
}

export async function resetPassword(token, newPassword) {
  // Fail early: don't spend the token if sessions can't be revoked afterwards
  requireSessionStore();

  const record = await findResetToken(hashToken(token));
  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired token");
  }

  const user = await findUserById(record.userId);
  if (!user || user.status !== "ACTIVE") {
    throw new HttpError(400, "Invalid or expired token");
  }

  const passwordHash = await hashPassword(newPassword);

  const consumed = await consumeResetToken(record, passwordHash);
  if (!consumed) {
    throw new HttpError(400, "Invalid or expired token");
  }

  // The password changed, so every existing login must die
  await revokeAllSessions(user.id);

  sendPasswordChangedEmail({ to: user.email, name: user.name }).catch(
    (error) => {
      console.error("Password changed email failed:", error.message);
    }
  );
}