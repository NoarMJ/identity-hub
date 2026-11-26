import { Router } from "express";
import { register, login, logout, me, verifyEmailHandler, resendVerificationHandler, forgotPasswordHandler, resetPasswordHandler } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/requireAuth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.post("/logout", logout);
router.get("/me", requireAuth, me);
router.post("/verify-email", verifyEmailHandler);
router.post("/resend-verification", resendVerificationHandler);
router.post("/forgot-password", forgotPasswordHandler);
router.post("/reset-password", resetPasswordHandler);

export default router;