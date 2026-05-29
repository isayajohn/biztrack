import type { NextFunction, Request, RequestHandler, Response } from "express";
import type { SystemRole } from "@prisma/client";
import { prisma } from "../config/prisma";
import { getActiveSecurityConfig } from "../services/securityConfig.service";
import { AppError } from "../utils/AppError";
import { verifyToken } from "../utils/jwt";

export async function requireAuth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

    if (!token) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    let userId: string;

    try {
      const payload = verifyToken(token);

      if (!payload.userId) {
        throw new AppError("Invalid or expired token.", 401);
      }

      userId = payload.userId;
    } catch {
      next(new AppError("Invalid or expired token.", 401));
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        emailVerifiedAt: true,
        lockedUntil: true,
      },
    });

    if (!user) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    if (user.status === "SUSPENDED") {
      next(new AppError("Your account is suspended.", 403));
      return;
    }

    if (user.lockedUntil && user.lockedUntil > new Date()) {
      next(new AppError("Account is temporarily locked. Try again later.", 403));
      return;
    }

    const securityConfig = await getActiveSecurityConfig();
    const canAccessVerificationFlow =
      req.originalUrl.startsWith("/api/auth/me") ||
      req.originalUrl.startsWith("/api/auth/change-password");

    if (
      securityConfig.requireEmailVerification &&
      !user.emailVerifiedAt &&
      user.role !== "SUPER_ADMIN" &&
      !canAccessVerificationFlow
    ) {
      next(new AppError("Please verify your email before continuing.", 403));
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function requireRole(...allowedRoles: SystemRole[]): RequestHandler {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      next(new AppError("Authentication required.", 401));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(new AppError("You do not have permission to access this resource.", 403));
      return;
    }

    next();
  };
}

export const requireSuperAdmin = requireRole("SUPER_ADMIN");
