import type { Request, Response } from "express";
import { listActivePublicPackages } from "../services/publicPackage.service";

export async function listPackages(_req: Request, res: Response) {
  const packages = await listActivePublicPackages();
  res.json({ success: true, data: packages });
}
