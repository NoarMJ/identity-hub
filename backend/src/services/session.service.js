import { createHash, randomBytes } from "node:crypto";
import { redis } from "../config/redis.js";
import { HttpError } from "../utils/httpError.js";
import { IDLE_TTL_SECONDS, ABSOLUTE_TTL_SECONDS } from "../config/session.js";

function keyFor(sessionId) {
  const digest = createHash("sha256").update(sessionId).digest("hex");
  return `session:${digest}`;
}

// One Redis Set per user, listing the keys of that user's sessions
function userSetKey(userId) {
  return `user-sessions:${userId}`;
}

// Never fall back to "no session store": fail closed instead
export function requireSessionStore() {
  if (!redis.isReady) {
    throw new HttpError(503, "Service temporarily unavailable");
  }
}

function looksLikeSessionId(value) {
  return typeof value === "string" && value.length === 43;
}

export async function createSession({ userId, ip, userAgent }) {
  requireSessionStore();

  const sessionId = randomBytes(32).toString("base64url"); // 43 characters
  const key = keyFor(sessionId);
  const data = {
    userId,
    createdAt: Date.now(),
    ip: ip ?? null,
    userAgent: (userAgent ?? "").slice(0, 200),
  };

  // multi(): the session and its index entry are written together
  await redis
    .multi()
    .set(key, JSON.stringify(data), { EX: IDLE_TTL_SECONDS })
    .sAdd(userSetKey(userId), key)
    .expire(userSetKey(userId), ABSOLUTE_TTL_SECONDS)
    .exec();

  return sessionId;
}

export async function getSession(sessionId) {
  if (!looksLikeSessionId(sessionId)) return null;
  requireSessionStore();

  const key = keyFor(sessionId);
  const raw = await redis.get(key);
  if (!raw) return null;

  const data = JSON.parse(raw);

  if (Date.now() - data.createdAt > ABSOLUTE_TTL_SECONDS * 1000) {
    await redis.multi().del(key).sRem(userSetKey(data.userId), key).exec();
    return null;
  }

  await redis.expire(key, IDLE_TTL_SECONDS); // sliding expiration
  return data;
}

export async function destroySession(sessionId) {
  if (!looksLikeSessionId(sessionId)) return;
  requireSessionStore();

  const key = keyFor(sessionId);
  const raw = await redis.get(key);
  if (!raw) return;

  const { userId } = JSON.parse(raw);
  await redis.multi().del(key).sRem(userSetKey(userId), key).exec();
}

// Ends every session a user has, on every device
export async function revokeAllSessions(userId) {
  requireSessionStore();

  const setKey = userSetKey(userId);
  const keys = await redis.sMembers(setKey);

  if (keys.length > 0) {
    await redis.del(keys);
  }
  await redis.del(setKey);
  return keys.length;
}