import type { Request, Response } from "express";
import * as businessService from "../services/business.service";

export async function getBusinessProfile(req: Request, res: Response) {
  const business = await businessService.getBusinessProfile(req.user!.id);
  res.json({ success: true, data: business });
}

export async function updateBusinessProfile(req: Request, res: Response) {
  const business = await businessService.upsertBusinessProfile(req.user!.id, req.body);
  res.json({ success: true, data: business });
}
