import type { Request, Response } from "express";
import * as emailConfigService from "../services/emailConfig.service";

export async function getEmailConfig(_req: Request, res: Response) {
  const config = await emailConfigService.getEmailConfig();
  res.json({ success: true, data: config });
}

export async function updateEmailConfig(req: Request, res: Response) {
  const config = await emailConfigService.updateEmailConfig(req.user!.id, req.body);
  res.json({ success: true, data: config });
}

export async function testEmailConfig(req: Request, res: Response) {
  const result = await emailConfigService.testEmailConfig(req.user!.id, req.body);
  res.json({ success: true, data: result });
}
