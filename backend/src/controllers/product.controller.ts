import type { Request, Response } from "express";
import * as productService from "../services/product.service";

export async function listProducts(req: Request, res: Response) {
  const products = await productService.listProducts(req.user!.id);
  res.json({ success: true, data: products });
}

export async function getProduct(req: Request, res: Response) {
  const product = await productService.getProduct(req.user!.id, String(req.params.id));
  res.json({ success: true, data: product });
}

export async function createProduct(req: Request, res: Response) {
  const product = await productService.createProduct(req.user!.id, req.body);
  res.status(201).json({ success: true, data: product });
}

export async function updateProduct(req: Request, res: Response) {
  const product = await productService.updateProduct(req.user!.id, String(req.params.id), req.body);
  res.json({ success: true, data: product });
}

export async function deleteProduct(req: Request, res: Response) {
  await productService.deleteProduct(req.user!.id, String(req.params.id));
  res.status(204).send();
}
