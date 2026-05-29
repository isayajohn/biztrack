import type { Request, Response } from "express";
import * as securityConfigService from "../services/securityConfig.service";

export async function getSecurityConfig(_req: Request, res: Response) {
  const config = await securityConfigService.getActiveSecurityConfig();
  res.json({ success: true, data: config });
}

export async function updateSecurityConfig(req: Request, res: Response) {
  const config = await securityConfigService.updateSecurityConfig(req.user!.id, req.body);
  res.json({ success: true, data: config });
}
