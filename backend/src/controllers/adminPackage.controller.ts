import type { Request, Response } from "express";
import * as adminPackageService from "../services/adminPackage.service";

export async function listPackages(_req: Request, res: Response) {
  const packages = await adminPackageService.listPackages();
  res.json({ success: true, data: packages });
}

export async function createPackage(req: Request, res: Response) {
  const plan = await adminPackageService.createPackage(req.user!.id, req.body);
  res.status(201).json({ success: true, data: plan });
}

export async function getPackageById(req: Request, res: Response) {
  const plan = await adminPackageService.getPackageById(String(req.params.id));
  res.json({ success: true, data: plan });
}

export async function updatePackage(req: Request, res: Response) {
  const plan = await adminPackageService.updatePackage(req.user!.id, String(req.params.id), req.body);
  res.json({ success: true, data: plan });
}

export async function updatePackageStatus(req: Request, res: Response) {
  const plan = await adminPackageService.updatePackageStatus(
    req.user!.id,
    String(req.params.id),
    req.body.status,
  );
  res.json({ success: true, data: plan });
}

export async function deletePackage(req: Request, res: Response) {
  await adminPackageService.deletePackage(req.user!.id, String(req.params.id));
  res.status(204).send();
}
