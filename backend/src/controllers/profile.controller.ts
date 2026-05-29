import type { Request, Response } from "express";
import * as profileService from "../services/profile.service";

export async function getProfile(req: Request, res: Response) {
  const profile = await profileService.getProfile(req.user!.id);
  res.json({ success: true, data: profile });
}
