import type { NextFunction, Request, Response } from "express";
import { runWithAuditContext } from "../utils/auditContext";

function requestIp(req: Request) {
  const forwardedFor = req.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || req.ip || undefined;
}

export function auditContextMiddleware(req: Request, _res: Response, next: NextFunction) {
  runWithAuditContext(
    {
      adminIpAddress: requestIp(req),
      userAgent: req.get("user-agent") ?? undefined,
    },
    next,
  );
}
