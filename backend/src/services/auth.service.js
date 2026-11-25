import { hashPassword } from "./password.service.js";
import { createUser } from "../repositories/user.repository.js";
import { HttpError } from "../utils/httpError.js";

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