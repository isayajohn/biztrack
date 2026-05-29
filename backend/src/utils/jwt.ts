import jwt from "jsonwebtoken";
import type { SignOptions } from "jsonwebtoken";
import type { SystemRole } from "@prisma/client";
import { env } from "../config/env";

export type JwtPayload = {
  userId: string;
  role: SystemRole;
};

export function signToken(payload: JwtPayload, expiresIn?: string | number): string {
  const options: SignOptions = {
    expiresIn: (expiresIn ?? env.jwtExpiresIn) as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, env.jwtSecret, options);
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, env.jwtSecret) as JwtPayload;
}
