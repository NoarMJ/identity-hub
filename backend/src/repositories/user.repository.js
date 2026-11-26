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

// Includes passwordHash and status: for login checks only, never send it to clients
export function findUserByEmail(email) {
  return prisma.user.findUnique({
    where: { email },
    select: { ...publicFields, passwordHash: true, status: true },
  });
}

export function findUserById(id) {
  return prisma.user.findUnique({
    where: { id },
    select: { ...publicFields, status: true },
  });
}