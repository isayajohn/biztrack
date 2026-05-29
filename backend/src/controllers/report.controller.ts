import type { Request, Response } from "express";
import * as reportService from "../services/report.service";

export async function getDashboard(req: Request, res: Response) {
  const dashboard = await reportService.getDashboard(req.user!.id);
  res.json({ success: true, data: dashboard });
}

export async function getReports(req: Request, res: Response) {
  const report = await reportService.getReportsByDateRange(req.user!.id, {
    startDate: String(req.query.startDate),
    endDate: String(req.query.endDate),
  });
  res.json({ success: true, data: report });
}
