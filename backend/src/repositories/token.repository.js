import { prisma } from "../config/prisma.js";

// One active verification token per user: delete old ones, create the new one
export function replaceVerificationToken(userId, tokenHash, expiresAt) {
  return prisma.$transaction([
    prisma.emailVerificationToken.deleteMany({ where: { userId } }),
    prisma.emailVerificationToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);
}

export function findVerificationToken(tokenHash) {
  return prisma.emailVerificationToken.findUnique({ where: { tokenHash } });
}

// Uses the token up and marks the email verified, all or nothing
export function consumeVerificationToken(record) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.emailVerificationToken.deleteMany({
      where: { id: record.id },
    });

    // Someone else used this token a moment ago
    if (deleted.count === 0) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { emailVerified: true },
    });
    await tx.emailVerificationToken.deleteMany({
      where: { userId: record.userId },
    });
    return true;
  });
}
export function replaceResetToken(userId, tokenHash, expiresAt) {
  return prisma.$transaction([
    prisma.passwordResetToken.deleteMany({ where: { userId } }),
    prisma.passwordResetToken.create({
      data: { userId, tokenHash, expiresAt },
    }),
  ]);
}

export function findResetToken(tokenHash) {
  return prisma.passwordResetToken.findUnique({ where: { tokenHash } });
}

// Uses the token up and saves the new password hash, all or nothing
export function consumeResetToken(record, passwordHash) {
  return prisma.$transaction(async (tx) => {
    const deleted = await tx.passwordResetToken.deleteMany({
      where: { id: record.id },
    });

    // Someone else used this token a moment ago
    if (deleted.count === 0) return false;

    await tx.user.update({
      where: { id: record.userId },
      data: { passwordHash },
    });
    await tx.passwordResetToken.deleteMany({
      where: { userId: record.userId },
    });
    return true;
  });
}