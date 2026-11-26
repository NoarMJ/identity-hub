import { createHash, randomBytes } from "node:crypto";
import { redis } from "../config/redis.js";
import { HttpError } from "../utils/httpError.js";
import { IDLE_TTL_SECONDS, ABSOLUTE_TTL_SECONDS } from "../config/session.js";

function keyFor(sessionId) {
  const digest = createHash("sha256").update(sessionId).digest("hex");
  return `session:${digest}`;
}

// Never fall back to "no session store": fail closed instead
function requireRedis() {
  if (!redis.isReady) {
    throw new HttpError(503, "Service temporarily unavailable");
  }
}

function looksLikeSessionId(value) {
  return typeof value === "string" && value.length === 43;
}

export async function createSession({ userId, ip, userAgent }) {
  requireRedis();

  const sessionId = randomBytes(32).toString("base64url"); // 43 characters
  const data = {
    userId,
    createdAt: Date.now(),
    ip: ip ?? null,
    userAgent: (userAgent ?? "").slice(0, 200),
  };

  await redis.set(keyFor(sessionId), JSON.stringify(data), {
    EX: IDLE_TTL_SECONDS,
  });

  return sessionId;
}

export async function getSession(sessionId) {
  if (!looksLikeSessionId(sessionId)) return null;
  requireRedis();

  const key = keyFor(sessionId);
  const raw = await redis.get(key);
  if (!raw) return null;

  const data = JSON.parse(raw);

  if (Date.now() - data.createdAt > ABSOLUTE_TTL_SECONDS * 1000) {
    await redis.del(key);
    return null;
  }

  await redis.expire(key, IDLE_TTL_SECONDS); // sliding expiration
  return data;
}

export async function destroySession(sessionId) {
  if (!looksLikeSessionId(sessionId)) return;
  requireRedis();
  await redis.del(keyFor(sessionId));
}