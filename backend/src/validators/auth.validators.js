import { z } from "zod";

const emailRule = z.string().trim().toLowerCase().email("Invalid email").max(254);

const newPasswordRule = z
  .string()
  .min(12, "Password must be at least 12 characters")
  .max(128, "Password must be at most 128 characters");

export const registerSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(100),
  email: emailRule,
  password: newPasswordRule,
});

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, "Password is required").max(128),
});

export const verifyEmailSchema = z.object({
  token: z.string().min(1, "Token is required").max(200),
});

export const resendVerificationSchema = z.object({
  email: emailRule,
});

export const forgotPasswordSchema = z.object({
  email: emailRule,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token is required").max(200),
  password: newPasswordRule,
});