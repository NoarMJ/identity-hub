import { prisma } from "../config/prisma.js";

const publicFields = {
  id: true,
  name: true,
  email: true,
  emailVerified: true,
  createdAt: true,
};

export function createUser({ name, email, passwordHash }) {
  return prisma.user.create({
    data: { name, email, passwordHash },
    select: publicFields,
  });
}