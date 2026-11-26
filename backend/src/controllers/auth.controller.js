import { registerSchema, loginSchema,verifyEmailSchema,resendVerificationSchema } from "../validators/auth.validators.js";
import { registerUser, loginUser } from "../services/auth.service.js";
import { destroySession } from "../services/session.service.js";
import { findUserById } from "../repositories/user.repository.js";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  sessionCookieClearOptions,
} from "../config/session.js";
import { verifyEmail, resendVerification } from "../services/verification.service.js";

function validationError(res, error) {
  return res.status(400).json({
    error: "Invalid input",
    details: error.issues.map((issue) => ({
      field: issue.path.join("."),
      message: issue.message,
    })),
  });
}

export async function register(req, res, next) {
  try {
    const result = registerSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result.error);

    const user = await registerUser(result.data);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function login(req, res, next) {
  try {
    const result = loginSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result.error);

    const { user, sessionId } = await loginUser({
      ...result.data,
      ip: req.ip,
      userAgent: req.get("user-agent"),
      previousSessionId: req.cookies?.[SESSION_COOKIE_NAME],
    });

    res.cookie(SESSION_COOKIE_NAME, sessionId, sessionCookieOptions);
    return res.status(200).json({ user });
  } catch (error) {
    return next(error);
  }
}

export async function logout(req, res, next) {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    if (sessionId) await destroySession(sessionId);

    res.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions);
    return res.status(204).end();
  } catch (error) {
    return next(error);
  }
}

export async function me(req, res, next) {
  try {
    const user = await findUserById(req.auth.userId);

    // Account deleted or suspended since login: end the session
    if (!user || user.status !== "ACTIVE") {
      await destroySession(req.auth.sessionId);
      res.clearCookie(SESSION_COOKIE_NAME, sessionCookieClearOptions);
      return res.status(401).json({ error: "Authentication required" });
    }

    const { status, ...publicUser } = user;
    return res.status(200).json({ user: publicUser });
  } catch (error) {
    return next(error);
  }
}

export async function verifyEmailHandler(req,res,next) {
    try{
        const result = verifyEmailSchema.safeParse(req.body);
        if (!result.success) return validationError(res, result.error);

        await verifyEmail(result.data.token);
    return res.status(200).json({ message: "Email verified" });
  } catch (error) {
    return next(error);
    }
}

export async function resendVerificationHandler(req, res, next) {
  try {
    const result = resendVerificationSchema.safeParse(req.body);
    if (!result.success) return validationError(res, result.error);

    await resendVerification(result.data.email);
    return res.status(202).json({
      message: "If the account exists and is not verified, an email has been sent.",
    });
  } catch (error) {
    return next(error);
  }
}