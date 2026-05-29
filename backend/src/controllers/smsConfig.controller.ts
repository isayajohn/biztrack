import type { Request, Response } from "express";
import * as smsConfigService from "../services/smsConfig.service";

export async function getSmsConfig(_req: Request, res: Response) {
  const config = await smsConfigService.getSmsConfig();
  res.json({ success: true, data: config });
}

export async function updateSmsConfig(req: Request, res: Response) {
  const config = await smsConfigService.updateSmsConfig(req.user!.id, req.body);
  res.json({ success: true, data: config });
}

export async function testSmsConfig(req: Request, res: Response) {
  const result = await smsConfigService.testSmsConfig(req.user!.id, req.body);
  res.json({ success: true, data: result });
}
