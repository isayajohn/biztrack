import type { SystemRole, UserStatus } from "@prisma/client";

export type AuthenticatedUser = {
  id: string;
  name: string;
  email: string;
  role: SystemRole;
  status: UserStatus;
  emailVerifiedAt?: Date | null;
  lockedUntil?: Date | null;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export {};
