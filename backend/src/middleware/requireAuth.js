import { SESSION_COOKIE_NAME } from "../config/session.js";
import { getSession } from "../services/session.service.js";

export async function requireAuth(req, res, next) {
  try {
    const sessionId = req.cookies?.[SESSION_COOKIE_NAME];
    const session = sessionId ? await getSession(sessionId) : null;

    if (!session) {
      return res.status(401).json({ error: "Authentication required" });
    }

    req.auth = { userId: session.userId, sessionId };
    return next();
  } catch (error) {
    return next(error);
  }
}