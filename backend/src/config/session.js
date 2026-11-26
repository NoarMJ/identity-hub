export const SESSION_COOKIE_NAME = "sid";
export const IDLE_TTL_SECONDS = 30 * 60;          // 30 minutes without activity
export const ABSOLUTE_TTL_SECONDS = 24 * 60 * 60; // 24 hours maximum

const baseCookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax",
  path: "/",
};

export const sessionCookieOptions = {
  ...baseCookieOptions,
  maxAge: ABSOLUTE_TTL_SECONDS * 1000, // browsers expect milliseconds
};

// Clearing must use the same flags, without maxAge
export const sessionCookieClearOptions = baseCookieOptions;