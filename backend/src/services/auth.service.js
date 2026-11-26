import { randomBytes } from "node:crypto";
import { hashPassword, verifyPassword } from "./password.service.js";
import { createSession, destroySession } from "./session.service.js";
import { createUser, findUserByEmail } from "../repositories/user.repository.js";
import { HttpError } from "../utils/httpError.js";

// Created once at startup. Verified against when the account doesn't exist,
// so "unknown email" costs the same time as "wrong password".
const dummyHash = await hashPassword(randomBytes(16).toString("hex"));

export async function registerUser({ name, email, password }) {
  const passwordHash = await hashPassword(password);

  try {
    return await createUser({ name, email, passwordHash });
  } catch (error) {
    // P2002 = Prisma's code for "unique constraint violated" (duplicate email)
    if (error.code === "P2002") {
      throw new HttpError(409, "Registration could not be completed");
    }
    throw error;
  }
}

export async function loginUser({
  email,
  password,
  ip,
  userAgent,
  previousSessionId,
}) {
  const user = await findUserByEmail(email);

  // Always run one Argon2 verification, whether or not the user exists
  const hashToCheck = user?.passwordHash ?? dummyHash;
  const passwordValid = await verifyPassword(hashToCheck, password);

  if (!user || !user.passwordHash || !passwordValid) {
    throw new HttpError(401, "Invalid email or password");
  }

  if (user.status !== "ACTIVE") {
    throw new HttpError(403, "Account is not active");
  }

  // Session fixation defence: drop any old session, always issue a new ID
  if (previousSessionId) {
    await destroySession(previousSessionId);
  }

  const sessionId = await createSession({ userId: user.id, ip, userAgent });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    },
    sessionId,
  };
}