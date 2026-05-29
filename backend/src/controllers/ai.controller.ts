import type { Request, Response } from "express";
import * as aiService from "../services/ai.service";

export async function generateBusinessSummary(req: Request, res: Response) {
  const summary = await aiService.generateBusinessSummary(req.user!.id);
  res.json({ success: true, data: summary });
}
