import type { Business, SystemRole, UserStatus } from "@prisma/client";
import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";

type SafeUserWithBusiness = {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: UserStatus;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  businesses: Business[];
};

export function serializeUser(user: SafeUserWithBusiness) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
    business: user.businesses[0] ?? null,
    businesses: user.businesses,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      businesses: true,
    },
  });
  if (!user) throw new AppError("User not found.", 404);
  return serializeUser(user);
}
