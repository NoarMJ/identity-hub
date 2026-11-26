import { redis } from "../config/redis.js";
import { generateToken, hashToken } from "../utils/tokens.js";
import { sendVerificationEmail } from "./email.service.js";
import {
  replaceVerificationToken,
  findVerificationToken,
  consumeVerificationToken,
} from "../repositories/token.repository.js";
import { findUserByEmail } from "../repositories/user.repository.js";
import { HttpError } from "../utils/httpError.js";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const RESEND_COOLDOWN_SECONDS = 60;

async function issueVerificationEmail(user) {
  const { token, tokenHash } = generateToken();
  await replaceVerificationToken(
    user.id,
    tokenHash,
    new Date(Date.now() + TOKEN_TTL_MS)
  );
  await sendVerificationEmail({ to: user.email, name: user.name, token });
}

// Fire-and-forget: the caller doesn't wait, and a failure is logged, never thrown
export function sendVerificationInBackground(user) {
  issueVerificationEmail(user).catch((error) => {
    console.error("Verification email failed:", error.message);
  });
}

export async function verifyEmail(token) {
  const record = await findVerificationToken(hashToken(token));

  if (!record || record.expiresAt < new Date()) {
    throw new HttpError(400, "Invalid or expired token");
  }

  const consumed = await consumeVerificationToken(record);
  if (!consumed) {
    throw new HttpError(400, "Invalid or expired token");
  }
}

// Always behaves the same from the outside, whether or not the account exists
export async function resendVerification(email) {
  try {
    const allowed = await redis.set(`resend:verify:${email}`, "1", {
      NX: true,
      EX: RESEND_COOLDOWN_SECONDS,
    });
    if (!allowed) return;
  } catch (error) {
    console.error("Resend cooldown check failed:", error.message);
    return;
  }

  const user = await findUserByEmail(email);
  if (user && !user.emailVerified && user.status === "ACTIVE") {
    sendVerificationInBackground(user);
  }
}