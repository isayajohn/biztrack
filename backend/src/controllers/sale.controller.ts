import type { Request, Response } from "express";
import * as saleService from "../services/sale.service";

export async function listSales(req: Request, res: Response) {
  const sales = await saleService.listSales(req.user!.id);
  res.json({ success: true, data: sales });
}

export async function getSale(req: Request, res: Response) {
  const sale = await saleService.getSale(req.user!.id, String(req.params.id));
  res.json({ success: true, data: sale });
}

export async function createSale(req: Request, res: Response) {
  const sale = await saleService.createSale(req.user!.id, req.body);
  res.status(201).json({ success: true, data: sale });
}

export async function updateSale(req: Request, res: Response) {
  const sale = await saleService.updateSale(req.user!.id, String(req.params.id), req.body);
  res.json({ success: true, data: sale });
}

export async function deleteSale(req: Request, res: Response) {
  await saleService.deleteSale(req.user!.id, String(req.params.id));
  res.status(204).send();
}
