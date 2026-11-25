import { registerSchema } from "../validators/auth.validators.js";
import { registerUser } from "../services/auth.service.js";

export async function register(req, res, next) {
  try {
    const result = registerSchema.safeParse(req.body);

    if (!result.success) {
      return res.status(400).json({
        error: "Invalid input",
        details: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
    }

    const user = await registerUser(result.data);
    return res.status(201).json({ user });
  } catch (error) {
    return next(error);
  }
}